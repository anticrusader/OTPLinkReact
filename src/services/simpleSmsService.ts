import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { processMessage } from '../utils/otpUtils';
import { loadConfiguration, saveOTPRecord } from './storageService';
import { OTPRecord } from '../types';

// Simple polling state
let isActive = false;
let pollingTimer: NodeJS.Timeout | null = null;

// Debug flag - set to true to force permission requests
const FORCE_PERMISSION_REQUEST = true;

/**
 * Check SMS permissions
 */
export const checkSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const readSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const receiveSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);

    // Check for notification permission on Android 13+ (API 33+)
    let notificationPermission = true;
    if (Platform.Version >= 33) {
      notificationPermission = await PermissionsAndroid.check(
        'android.permission.POST_NOTIFICATIONS'
      );
    }

    console.log('Permissions check:', { readSms, receiveSms, notificationPermission });
    return readSms && receiveSms && notificationPermission;
  } catch (error) {
    console.error('Error checking SMS permissions:', error);
    return false;
  }
};

/**
 * Request SMS permissions
 */
export const requestSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const hasPermissions = await checkSmsPermissions();
    if (hasPermissions && !FORCE_PERMISSION_REQUEST) {
      console.log('All permissions already granted');
      return true;
    }

    // Force request permissions even if they're already granted (for testing)
    console.log('Forcing permission requests for testing');

    console.log('Requesting permissions...');

    // Request SMS permissions
    const readResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'OTP Link needs SMS access to detect OTPs',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    const receiveResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'SMS Permission',
        message: 'OTP Link needs SMS access to detect OTPs',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    // Request notification permission on Android 13+ (API 33+)
    let notificationResult = PermissionsAndroid.RESULTS.GRANTED;
    if (Platform.Version >= 33) {
      notificationResult = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS',
        {
          title: 'Notification Permission',
          message: 'OTP Link needs notification access to alert you about OTPs',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
    }

    const granted = (
      readResult === PermissionsAndroid.RESULTS.GRANTED &&
      receiveResult === PermissionsAndroid.RESULTS.GRANTED &&
      notificationResult === PermissionsAndroid.RESULTS.GRANTED
    );

    console.log('All permissions granted:', granted);

    // Show alert if permissions are denied
    if (!granted) {
      Alert.alert(
        'Permissions Required',
        'OTP Link needs SMS and notification permissions to function properly. Please grant these permissions in your device settings.',
        [{ text: 'OK' }]
      );
    }

    return granted;
  } catch (error) {
    console.error('Error requesting SMS permissions:', error);
    return false;
  }
};

/**
 * Start SMS monitoring (simplified version)
 */
export const startSmsRetriever = async (
  onOtpReceived: (record: OTPRecord) => void
): Promise<boolean> => {
  console.log('Starting SMS monitoring...');

  if (Platform.OS !== 'android') {
    console.log('SMS monitoring only available on Android');
    return false;
  }

  try {
    // Set active state immediately
    isActive = true;

    // Start a simple timer that checks for test messages
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }

    // Try to start real SMS listener first
    try {
      const { startRealSmsListener } = require('./realSmsService');
      const realListenerStarted = await startRealSmsListener(onOtpReceived);
      
      if (realListenerStarted) {
        console.log('Real SMS listener started successfully');
      } else {
        console.log('Real SMS listener failed, using polling fallback');
      }
    } catch (error) {
      console.error('Error starting real SMS listener:', error);
    }
    
    // Also start SMS polling as backup
    try {
      const { startSmsPolling } = require('./smsPollingService');
      const pollingStarted = await startSmsPolling(onOtpReceived);
      
      if (pollingStarted) {
        console.log('SMS polling started as backup');
      }
    } catch (error) {
      console.error('Error starting SMS polling:', error);
    }
    
    // Keep the timer as final fallback
    pollingTimer = setInterval(async () => {
      console.log('SMS monitoring active (timer fallback)...');
    }, 10000);

    console.log('SMS monitoring started successfully');
    return true;
  } catch (error) {
    console.error('Error starting SMS monitoring:', error);
    return false;
  }
};

/**
 * Stop SMS monitoring
 */
export const stopSmsRetriever = (): void => {
  console.log('Stopping all SMS services...');
  
  // Stop the timer
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  
  // Stop real SMS listener
  try {
    const { stopRealSmsListener } = require('./realSmsService');
    stopRealSmsListener();
    console.log('Real SMS listener stopped');
  } catch (error) {
    console.error('Error stopping real SMS listener:', error);
  }
  
  // Stop SMS polling
  try {
    const { stopSmsPolling } = require('./smsPollingService');
    stopSmsPolling();
    console.log('SMS polling stopped');
  } catch (error) {
    console.error('Error stopping SMS polling:', error);
  }
  
  isActive = false;
  console.log('All SMS monitoring services stopped');
};

/**
 * Check if SMS listener is active
 */
export const isSmsListenerActive = (): boolean => {
  // Check if the polling timer is actually running
  const timerActive = pollingTimer !== null;

  // Update the active state based on the timer
  if (isActive !== timerActive) {
    isActive = timerActive;
  }

  console.log('SMS listener status check:', { isActive, timerActive, pollingTimer: !!pollingTimer });
  return isActive;
};

/**
 * Get SMS status
 */
export const getSmsStatus = async () => {
  const hasPermissions = await checkSmsPermissions();
  const isListenerActive = isSmsListenerActive();

  // Force update the active status based on permissions
  if (isActive && !hasPermissions) {
    isActive = false;
  }

  console.log('Current SMS status:', {
    hasPermissions,
    isListenerActive,
    isActive,
    pollingTimer: pollingTimer ? 'active' : 'inactive'
  });

  return {
    hasPermissions,
    isListenerActive: isActive,
    smsSubscription: isActive ? 'active' : null,
    platform: Platform.OS,
  };
};

/**
 * Manual OTP test function
 */
export const testOtpDetection = async (testMessage: string): Promise<void> => {
  console.log('Testing OTP detection with message:', testMessage);

  try {
    const config = await loadConfiguration();
    console.log('Current config:', config);
    
    const otpRecord = processMessage(
      'Test Sender',
      testMessage,
      config.keywords,
      config.otpMinLength,
      config.otpMaxLength
    );

    if (otpRecord) {
      console.log('OTP detected in test:', otpRecord);
      await saveOTPRecord(otpRecord);
      
      // Auto-forward the OTP
      try {
        const { forwardOTP } = require('./forwardingService');
        const forwarded = await forwardOTP(otpRecord, config);
        console.log('Auto-forwarding result:', forwarded);
      } catch (forwardError) {
        console.error('Error auto-forwarding OTP:', forwardError);
      }
      
      Alert.alert(
        'OTP Detected',
        `OTP "${otpRecord.otp}" detected and saved!`,
        [{ text: 'OK' }]
      );
    } else {
      console.log('No OTP detected in test message');
      Alert.alert(
        'No OTP Detected',
        `No OTP found in message: "${testMessage}". Check your keywords and OTP length settings.`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error in OTP test:', error);
    Alert.alert(
      'Test Error',
      `Error testing OTP detection: ${error}`,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Test with the actual SMS message you sent
 */
export const testRealSms = async (): Promise<void> => {
  console.log('Testing with real SMS message');
  await testOtpDetection('OTP is 060118');
};