package com.otplink;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;

import java.util.Properties;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import android.os.AsyncTask;
import android.util.Log;

public class SmtpModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmtpModule";

    public SmtpModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SmtpModule";
    }

    @ReactMethod
    public void sendEmail(ReadableMap emailData, Promise promise) {
        try {
            String host = emailData.getString("host");
            int port = emailData.getInt("port");
            String username = emailData.getString("username");
            String password = emailData.getString("password");
            String to = emailData.getString("to");
            String subject = emailData.getString("subject");
            String body = emailData.getString("body");

            Log.d(TAG, "Sending email to: " + to);
            Log.d(TAG, "SMTP Host: " + host + ":" + port);
            Log.d(TAG, "Username: " + username);

            // Execute email sending in background thread
            new SendEmailTask(host, port, username, password, to, subject, body, promise).execute();

        } catch (Exception e) {
            Log.e(TAG, "Error sending email", e);
            promise.reject("EMAIL_ERROR", "Error sending email: " + e.getMessage());
        }
    }

    private static class SendEmailTask extends AsyncTask<Void, Void, String> {
        private String host, username, password, to, subject, body;
        private int port;
        private Promise promise;

        public SendEmailTask(String host, int port, String username, String password, 
                           String to, String subject, String body, Promise promise) {
            this.host = host;
            this.port = port;
            this.username = username;
            this.password = password;
            this.to = to;
            this.subject = subject;
            this.body = body;
            this.promise = promise;
        }

        @Override
        protected String doInBackground(Void... voids) {
            try {
                // Setup mail server properties
                Properties props = new Properties();
                props.put("mail.smtp.auth", "true");
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.host", host);
                props.put("mail.smtp.port", String.valueOf(port));
                props.put("mail.smtp.ssl.trust", host);

                Log.d(TAG, "SMTP Properties configured");

                // Create session with authentication
                Session session = Session.getInstance(props, new javax.mail.Authenticator() {
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(username, password);
                    }
                });

                Log.d(TAG, "SMTP Session created");

                // Create message
                Message message = new MimeMessage(session);
                message.setFrom(new InternetAddress(username));
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
                message.setSubject(subject);
                message.setText(body);

                Log.d(TAG, "Message created, sending...");

                // Send message
                Transport.send(message);

                Log.d(TAG, "Email sent successfully!");
                return "SUCCESS";

            } catch (MessagingException e) {
                Log.e(TAG, "MessagingException: " + e.getMessage(), e);
                return "ERROR: " + e.getMessage();
            } catch (Exception e) {
                Log.e(TAG, "General Exception: " + e.getMessage(), e);
                return "ERROR: " + e.getMessage();
            }
        }

        @Override
        protected void onPostExecute(String result) {
            if (result.equals("SUCCESS")) {
                promise.resolve("Email sent successfully");
            } else {
                promise.reject("EMAIL_ERROR", result);
            }
        }
    }
}