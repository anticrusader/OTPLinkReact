package com.otplink;

import android.content.Context;
import android.content.SharedPreferences;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import android.util.Log;

public class ConfigSyncModule extends ReactContextBaseJavaModule {
    private static final String TAG = "ConfigSyncModule";
    private static final String PREFS_NAME = "RN_ASYNC_STORAGE_";
    
    public ConfigSyncModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ConfigSyncModule";
    }

    @ReactMethod
    public void syncConfigToNative(String configJson, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("otp_link_config", configJson);
            editor.apply();
            
            Log.d(TAG, "Configuration synced to native SharedPreferences");
            promise.resolve("Configuration synced successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error syncing configuration", e);
            promise.reject("SYNC_ERROR", "Failed to sync configuration: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isOtpAlreadyProcessed(String otp, String sender, double timestamp, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            
            // Create the same key format as background processor
            String otpKey = otp + "-" + sender + "-" + ((long)timestamp / 300000); // 5-minute window
            
            String processedOtps = prefs.getString("processed_otps", "[]");
            org.json.JSONArray otpsArray = new org.json.JSONArray(processedOtps);
            
            for (int i = 0; i < otpsArray.length(); i++) {
                if (otpsArray.getString(i).equals(otpKey)) {
                    Log.d(TAG, "OTP already processed in background: " + otpKey);
                    promise.resolve(true);
                    return;
                }
            }
            
            Log.d(TAG, "OTP not processed in background: " + otpKey);
            promise.resolve(false);
        } catch (Exception e) {
            Log.e(TAG, "Error checking if OTP was processed", e);
            promise.resolve(false);
        }
    }
}