package com.otplink;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class SmsTestModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsTestModule";
    
    public SmsTestModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SmsTestModule";
    }

    @ReactMethod
    public void testSmsReceiver(Promise promise) {
        try {
            Log.d(TAG, "Testing SMS receiver manually");
            
            Context context = getReactApplicationContext();
            SmsReceiver receiver = new SmsReceiver();
            
            // Create a test intent
            Intent testIntent = new Intent("android.provider.Telephony.SMS_RECEIVED");
            
            // Simulate SMS reception
            receiver.onReceive(context, testIntent);
            
            promise.resolve("SMS receiver test completed - check logs");
        } catch (Exception e) {
            Log.e(TAG, "Error testing SMS receiver", e);
            promise.reject("TEST_ERROR", "Failed to test SMS receiver: " + e.getMessage());
        }
    }

    @ReactMethod
    public void testBackgroundProcessor(Promise promise) {
        try {
            Log.d(TAG, "Testing background processor manually");
            
            Context context = getReactApplicationContext();
            BackgroundOtpProcessor processor = new BackgroundOtpProcessor(context);
            
            // Test with a sample OTP message
            processor.processSms("+1234567890", "Your OTP is 123456 for verification");
            
            promise.resolve("Background processor test completed - check logs");
        } catch (Exception e) {
            Log.e(TAG, "Error testing background processor", e);
            promise.reject("TEST_ERROR", "Failed to test background processor: " + e.getMessage());
        }
    }
}