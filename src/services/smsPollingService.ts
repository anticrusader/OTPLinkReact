import { Platform, PermissionsAndroid } from 'react-native';

let SmsAndroid: any = null;
try {
  SmsAndroid = require('react-native-get-sms-android');
} catch (error) {
  console.error('Failed to load react-native-get-sms-android:', error);
}
import { processMessage } from '../utils/otpUtils';
import { loadConfiguration, saveOTPRecord } from './storageService';
import { OTPRecord } from '../types';

// Polling state
let isPolling = false;
let pollingInterval: NodeJS.Timeout | null = null;
let lastSmsTimestamp = 0;

/**
 * Check if SMS permissions are granted
 */
export const checkSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const readSmsGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const receiveSmsGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);

    console.log('SMS permissions check:', { readSmsGranted, receiveSmsGranted });
    return readSmsGranted && receiveSmsGranted;
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
    const alreadyGranted = await checkSmsPermissions();
    if (alreadyGranted) {
      console.log('SMS permissions already granted');
      return true;
    }

    console.log('Requesting SMS permissions...');

    const readSmsResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission Required',
        message: 'OTP Link needs access to read SMS messages to automatically detect OTPs.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );

    const receiveSmsResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'SMS Permission Required',
        message: 'OTP Link needs access to receive SMS messages to automatically detect OTPs.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );

    const result = (
      readSmsResult === PermissionsAndroid.RESULTS.GRANTED &&
      receiveSmsResult === PermissionsAndroid.RESULTS.GRANTED
    );

    console.log('SMS permissions result:', result);
    return result;
  } catch (error) {
    console.error('Error requesting SMS permissions:', error);
    return false;
  }
};

/**
 * Get recent SMS messages
 */
const getRecentSms = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      if (!SmsAndroid || !SmsAndroid.list) {
        console.error('SmsAndroid.list is not available');
        reject(new Error('SMS Android library not available'));
        return;
      }

      const filter = {
        box: 'inbox',
        maxCount: 10,
        indexFrom: 0,
      };

      console.log('Calling SmsAndroid.list with filter:', filter);

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: any) => {
          console.error('Failed to get SMS list:', fail);
          reject(fail);
        },
        (count: number, smsList: string) => {
          try {
            console.log('SMS list response:', { count, smsList: smsList?.substring(0, 100) + '...' });
            const messages = JSON.parse(smsList);
            console.log(`Retrieved ${count} SMS messages`);
            resolve(messages);
          } catch (error) {
            console.error('Error parsing SMS list:', error);
            reject(error);
          }
        }
      );
    } catch (error) {
      console.error('Error in getRecentSms:', error);
      reject(error);
    }
  });
};

/**
 * Process new SMS messages
 */
const processNewSms = async (onOtpReceived: (record: OTPRecord) => void) => {
  try {
    const messages = await getRecentSms();
    const config = await loadConfiguration();

    // Filter messages newer than last check
    const newMessages = messages.filter(msg => msg.date > lastSmsTimestamp);

    if (newMessages.length > 0) {
      console.log(`Found ${newMessages.length} new SMS messages`);

      // Update timestamp to latest message
      lastSmsTimestamp = Math.max(...newMessages.map(msg => msg.date));

      // Process each new message
      for (const msg of newMessages) {
        console.log('Processing SMS:', {
          address: msg.address,
          body: msg.body,
          date: new Date(msg.date).toLocaleString()
        });

        const otpRecord = processMessage(
          msg.address || 'Unknown',
          msg.body || '',
          config.keywords,
          config.otpMinLength,
          config.otpMaxLength
        );

        if (otpRecord) {
          console.log('OTP detected:', otpRecord);
          await saveOTPRecord(otpRecord);
          onOtpReceived(otpRecord);
          
          // Auto-forward the OTP
          try {
            const { forwardOTP } = require('./forwardingService');
            const forwarded = await forwardOTP(otpRecord, config);
            console.log('Auto-forwarding result:', forwarded);
          } catch (forwardError) {
            console.error('Error auto-forwarding OTP:', forwardError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing SMS messages:', error);
  }
};

/**
 * Start SMS polling
 */
export const startSmsPolling = async (
  onOtpReceived: (record: OTPRecord) => void
): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('SMS polling is only available on Android');
    return false;
  }

  if (!SmsAndroid) {
    console.error('SMS Android library not available');
    return false;
  }

  try {
    console.log('Starting SMS polling...');

    // Initialize timestamp to current time
    lastSmsTimestamp = Date.now();

    // Start polling every 2 seconds
    pollingInterval = setInterval(() => {
      processNewSms(onOtpReceived);
    }, 2000);

    isPolling = true;
    console.log('SMS polling started successfully');
    return true;
  } catch (error) {
    console.error('Error starting SMS polling:', error);
    return false;
  }
};

/**
 * Stop SMS polling
 */
export const stopSmsPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  isPolling = false;
  console.log('SMS polling stopped');
};

/**
 * Check if SMS polling is active
 */
export const isSmsPollingActive = (): boolean => {
  return isPolling;
};

/**
 * Get SMS status
 */
export const getSmsStatus = async () => {
  const hasPermissions = await checkSmsPermissions();
  const isActive = isSmsPollingActive();

  const status = {
    hasPermissions,
    isListenerActive: isActive,
    smsSubscription: isActive ? 'polling' : null,
    platform: Platform.OS,
  };

  console.log('SMS polling status:', status);
  return status;
};