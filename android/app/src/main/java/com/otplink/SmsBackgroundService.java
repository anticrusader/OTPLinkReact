package com.otplink;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class SmsBackgroundService extends Service {
    private static final String TAG = "SmsBackgroundService";
    private static final String CHANNEL_ID = "OTP_LINK_CHANNEL";
    private static final int NOTIFICATION_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Log.d(TAG, "Background service created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Background service started");
        
        // Start as foreground service
        startForeground(NOTIFICATION_ID, createNotification());
        
        if (intent != null) {
            String sender = intent.getStringExtra("sender");
            String message = intent.getStringExtra("message");
            
            if (sender != null && message != null) {
                Log.d(TAG, "Processing SMS in background: " + sender + " - " + message);
                processSmsInBackground(sender, message);
            }
        }
        
        // Stop the service after processing
        stopSelf();
        
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "OTP Link Background Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Processing OTP messages in background");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OTP Link")
            .setContentText("Processing OTP message...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(false)
            .build();
    }

    private void processSmsInBackground(String sender, String message) {
        // This is where you would process the SMS and send email
        // For now, we'll just log it
        Log.d(TAG, "Background processing SMS from: " + sender);
        Log.d(TAG, "Message: " + message);
        
        // TODO: Add OTP detection and email forwarding logic here
        // This would involve:
        // 1. Loading configuration from SharedPreferences
        // 2. Processing message for OTP using same logic as React Native
        // 3. Sending email using SMTP if OTP is found
        
        try {
            // Simulate processing time
            Thread.sleep(1000);
            Log.d(TAG, "Background SMS processing completed");
        } catch (InterruptedException e) {
            Log.e(TAG, "Background processing interrupted", e);
        }
    }
}