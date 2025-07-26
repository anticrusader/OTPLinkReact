package com.otplink;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Properties;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class BackgroundOtpProcessor {
    private static final String TAG = "BackgroundOtpProcessor";
    private static final String PREFS_NAME = "RN_ASYNC_STORAGE_";
    private static final String CONFIG_KEY = "otp_link_config";
    private static final String PROCESSED_OTPS_KEY = "processed_otps";
    
    private Context context;
    
    public BackgroundOtpProcessor(Context context) {
        this.context = context;
    }
    
    public void processSms(String sender, String message) {
        Log.d(TAG, "=== BACKGROUND OTP PROCESSING STARTED ===");
        Log.d(TAG, "Sender: " + sender);
        Log.d(TAG, "Message: " + message);
        
        try {
            // Load configuration
            Configuration config = loadConfiguration();
            if (config == null) {
                Log.e(TAG, "No configuration found, cannot process SMS");
                return;
            }
            
            // Check if SMS listener is enabled
            if (!config.smsListenerEnabled) {
                Log.d(TAG, "SMS listener is disabled, skipping SMS processing");
                return;
            }
            
            // Check if message contains keywords
            if (!containsKeywords(message, config.keywords)) {
                Log.d(TAG, "Message does not contain required keywords");
                return;
            }
            
            // Extract OTP
            String otp = extractOtp(message, config.otpMinLength, config.otpMaxLength);
            if (otp == null) {
                Log.d(TAG, "No OTP found in message");
                return;
            }
            
            Log.d(TAG, "OTP detected in background: " + otp);
            
            // Check if this OTP was already processed (use 5-minute window)
            String otpKey = otp + "-" + sender + "-" + (System.currentTimeMillis() / 300000); // Group by 5 minutes
            if (isOtpAlreadyProcessed(otpKey)) {
                Log.d(TAG, "OTP already processed, skipping: " + otpKey);
                return;
            }
            
            // Send email if configured
            if (config.emailSettings != null && config.emailSettings.recipient != null && !config.emailSettings.recipient.isEmpty()) {
                boolean emailSent = sendOtpEmail(otp, sender, message, config.emailSettings);
                if (emailSent) {
                    // Mark OTP as processed and save to React Native storage
                    markOtpAsProcessed(otpKey);
                    saveOtpToReactNativeStorage(otp, sender, message);
                }
            } else {
                Log.d(TAG, "Email not configured, skipping email forwarding");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing SMS in background", e);
        }
    }
    
    private Configuration loadConfiguration() {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String configJson = prefs.getString(CONFIG_KEY, null);
            
            if (configJson == null) {
                Log.d(TAG, "No configuration found in SharedPreferences");
                return null;
            }
            
            JSONObject json = new JSONObject(configJson);
            Configuration config = new Configuration();
            
            // Load keywords
            JSONArray keywordsArray = json.optJSONArray("keywords");
            config.keywords = new ArrayList<>();
            if (keywordsArray != null) {
                for (int i = 0; i < keywordsArray.length(); i++) {
                    config.keywords.add(keywordsArray.getString(i));
                }
            }
            
            // Load OTP settings
            config.otpMinLength = json.optInt("otpMinLength", 4);
            config.otpMaxLength = json.optInt("otpMaxLength", 8);
            
            // Load SMS listener state
            config.smsListenerEnabled = json.optBoolean("smsListenerEnabled", true);
            
            // Load email settings
            JSONObject emailSettings = json.optJSONObject("emailSettings");
            if (emailSettings != null) {
                config.emailSettings = new EmailSettings();
                config.emailSettings.smtpHost = emailSettings.optString("smtpHost", "");
                config.emailSettings.smtpPort = emailSettings.optInt("smtpPort", 587);
                config.emailSettings.username = emailSettings.optString("username", "");
                config.emailSettings.password = emailSettings.optString("password", "");
                config.emailSettings.recipient = emailSettings.optString("recipient", "");
            }
            
            Log.d(TAG, "Configuration loaded successfully");
            return config;
            
        } catch (Exception e) {
            Log.e(TAG, "Error loading configuration", e);
            return null;
        }
    }
    
    private boolean containsKeywords(String message, List<String> keywords) {
        String lowerMessage = message.toLowerCase();
        for (String keyword : keywords) {
            if (lowerMessage.contains(keyword.toLowerCase())) {
                Log.d(TAG, "Found keyword: " + keyword);
                return true;
            }
        }
        return false;
    }
    
    private String extractOtp(String message, int minLength, int maxLength) {
        Pattern pattern = Pattern.compile("\\d+");
        Matcher matcher = pattern.matcher(message);
        
        while (matcher.find()) {
            String digits = matcher.group();
            if (digits.length() >= minLength && digits.length() <= maxLength) {
                Log.d(TAG, "Found OTP: " + digits);
                return digits;
            }
        }
        
        return null;
    }
    
    private boolean sendOtpEmail(String otp, String sender, String message, EmailSettings emailSettings) {
        Log.d(TAG, "Sending OTP email in background");
        
        try {
            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.host", emailSettings.smtpHost);
            props.put("mail.smtp.port", String.valueOf(emailSettings.smtpPort));
            props.put("mail.smtp.ssl.trust", emailSettings.smtpHost);
            
            Session session = Session.getInstance(props, new javax.mail.Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(emailSettings.username, emailSettings.password);
                }
            });
            
            Message emailMessage = new MimeMessage(session);
            emailMessage.setFrom(new InternetAddress(emailSettings.username));
            emailMessage.setRecipients(Message.RecipientType.TO, InternetAddress.parse(emailSettings.recipient));
            emailMessage.setSubject("OTPLink - OTP: " + otp + " from " + sender);
            emailMessage.setText("OTP: " + otp + "\nFrom: " + sender + "\nMessage: " + message + "\nTime: " + new java.util.Date() + "\n\nSent by OTPLink App (Background)");
            
            Transport.send(emailMessage);
            
            Log.d(TAG, "OTP email sent successfully in background");
            return true;
            
        } catch (MessagingException e) {
            Log.e(TAG, "Error sending OTP email in background", e);
            return false;
        }
    }
    
    private boolean isOtpAlreadyProcessed(String otpKey) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String processedOtps = prefs.getString(PROCESSED_OTPS_KEY, "[]");
            JSONArray otpsArray = new JSONArray(processedOtps);
            
            for (int i = 0; i < otpsArray.length(); i++) {
                if (otpsArray.getString(i).equals(otpKey)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            Log.e(TAG, "Error checking processed OTPs", e);
            return false;
        }
    }
    
    private void markOtpAsProcessed(String otpKey) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String processedOtps = prefs.getString(PROCESSED_OTPS_KEY, "[]");
            JSONArray otpsArray = new JSONArray(processedOtps);
            
            // Add new OTP key
            otpsArray.put(otpKey);
            
            // Keep only last 50 processed OTPs to prevent memory issues
            if (otpsArray.length() > 50) {
                JSONArray newArray = new JSONArray();
                for (int i = otpsArray.length() - 50; i < otpsArray.length(); i++) {
                    newArray.put(otpsArray.get(i));
                }
                otpsArray = newArray;
            }
            
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString(PROCESSED_OTPS_KEY, otpsArray.toString());
            editor.apply();
            
            Log.d(TAG, "Marked OTP as processed: " + otpKey);
        } catch (Exception e) {
            Log.e(TAG, "Error marking OTP as processed", e);
        }
    }
    
    private void saveOtpToReactNativeStorage(String otp, String sender, String message) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("RN_ASYNC_STORAGE_", Context.MODE_PRIVATE);
            String recordsJson = prefs.getString("otp_link_records", "[]");
            JSONArray recordsArray = new JSONArray(recordsJson);
            
            // Create new OTP record
            JSONObject newRecord = new JSONObject();
            newRecord.put("id", java.util.UUID.randomUUID().toString());
            newRecord.put("otp", otp);
            newRecord.put("source", "sms");
            newRecord.put("sender", sender);
            newRecord.put("message", message);
            newRecord.put("timestamp", new java.util.Date().toInstant().toString());
            newRecord.put("forwarded", true);
            newRecord.put("forwardingMethod", "email");
            
            // Add to beginning of array
            JSONArray newArray = new JSONArray();
            newArray.put(newRecord);
            for (int i = 0; i < recordsArray.length() && i < 99; i++) { // Keep max 100 records
                newArray.put(recordsArray.get(i));
            }
            
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("otp_link_records", newArray.toString());
            boolean success = editor.commit(); // Use commit for immediate write
            
            Log.d(TAG, "SharedPreferences commit success: " + success);
            
            Log.d(TAG, "Saved OTP record to React Native storage");
            Log.d(TAG, "OTP record: " + newRecord.toString());
            Log.d(TAG, "Total records now: " + newArray.length());
        } catch (Exception e) {
            Log.e(TAG, "Error saving OTP record", e);
        }
    }
    
    // Configuration classes
    private static class Configuration {
        List<String> keywords;
        int otpMinLength;
        int otpMaxLength;
        boolean smsListenerEnabled;
        EmailSettings emailSettings;
    }
    
    private static class EmailSettings {
        String smtpHost;
        int smtpPort;
        String username;
        String password;
        String recipient;
    }
}