package com.otplink;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "=== SMS RECEIVER TRIGGERED ===");
        Log.d(TAG, "Intent action: " + intent.getAction());
        Log.d(TAG, "Context: " + context.getClass().getSimpleName());

        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();
                        
                        Log.d(TAG, "SMS from: " + sender + ", Message: " + messageBody);
                        
                        // Send to React Native if app is running
                        sendSmsToReactNative(context, sender, messageBody);
                        
                        // Process SMS directly in receiver (simpler approach)
                        processSmsDirectly(context, sender, messageBody);
                    }
                }
            }
        }
    }

    private void sendSmsToReactNative(Context context, String sender, String message) {
        try {
            ReactApplication reactApplication = (ReactApplication) context.getApplicationContext();
            ReactInstanceManager reactInstanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            
            if (reactContext != null) {
                WritableMap params = Arguments.createMap();
                params.putString("originatingAddress", sender);
                params.putString("messageBody", message);
                params.putDouble("timestamp", System.currentTimeMillis());
                
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onSMSReceived", params);
                    
                Log.d(TAG, "SMS sent to React Native");
            } else {
                Log.d(TAG, "React context not available");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending SMS to React Native: " + e.getMessage());
        }
    }

    private void processSmsDirectly(Context context, String sender, String message) {
        Log.d(TAG, "Processing SMS directly in background: " + sender + " - " + message);
        
        try {
            // Start background processing in a separate thread
            new Thread(() -> {
                try {
                    BackgroundOtpProcessor processor = new BackgroundOtpProcessor(context);
                    processor.processSms(sender, message);
                } catch (Exception e) {
                    Log.e(TAG, "Error in background OTP processing", e);
                }
            }).start();
        } catch (Exception e) {
            Log.e(TAG, "Error starting background processing", e);
        }
    }
}