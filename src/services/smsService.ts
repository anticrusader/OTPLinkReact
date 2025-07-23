import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { processMessage } from '../utils/otpUtils';
import { loadConfiguration, saveOTPRecord } from './storageService';
import { OTPRecord } from '../types';

// Import SMS polling functions
import {
  startSmsPolling,
  stopSmsPolling,
  isSmsPollingActive,
  getSmsStatus as getPollingStatus,
  checkSmsPermissions as checkPollingPermissions,
  requestSmsPermissions as requestPollingPermissions,
} from './smsPollingService';

/**
 * Check if SMS listener is active
 */
export const isSmsListenerActive = (): boolean => {
  return isSmsPollingActive();
};

/**
 * Get detailed SMS status for debugging
 */
export const getSmsStatus = async () => {
  return await getPollingStatus();
};

/**
 * Check if SMS permissions are granted
 */
export const checkSmsPermissions = async (): Promise<boolean> => {
  return await checkPollingPermissions();
};

/**
 * Open device settings for app permissions
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    await Linking.openSettings();
  } catch (error) {
    console.error('Error opening app settings:', error);
  }
};

/**
 * Request SMS permissions (Android only)
 */
export const requestSmsPermissions = async (): Promise<boolean> => {
  return await requestPollingPermissions();
};

/**
 * Start SMS retriever (now using polling)
 */
export const startSmsRetriever = async (
  onOtpReceived: (record: OTPRecord) => void
): Promise<boolean> => {
  console.log('Starting SMS polling...');
  return await startSmsPolling(onOtpReceived);
};

/**
 * Stop SMS retriever (now using polling)
 */
export const stopSmsRetriever = (): void => {
  console.log('Stopping SMS polling...');
  stopSmsPolling();
};