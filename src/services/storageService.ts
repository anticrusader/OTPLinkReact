import AsyncStorage from '@react-native-async-storage/async-storage';
import { Configuration, OTPRecord } from '../types';
import { getDefaultKeywords } from '../utils/otpUtils';

// Storage keys
const CONFIG_KEY = 'otp_link_config';
const OTP_RECORDS_KEY = 'otp_link_records';

// Default configuration
const DEFAULT_CONFIG: Configuration = {
  keywords: getDefaultKeywords(),
  otpMinLength: 4,
  otpMaxLength: 8,
  webhookUrl: '',
  emailSettings: {
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: '',
    recipient: '',
  },
};

/**
 * Save configuration to AsyncStorage
 */
export const saveConfiguration = async (config: Configuration): Promise<void> => {
  try {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw error;
  }
};

/**
 * Load configuration from AsyncStorage
 */
export const loadConfiguration = async (): Promise<Configuration> => {
  try {
    const configStr = await AsyncStorage.getItem(CONFIG_KEY);
    if (configStr) {
      return JSON.parse(configStr);
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Save OTP record to AsyncStorage
 */
export const saveOTPRecord = async (record: OTPRecord): Promise<void> => {
  try {
    const records = await loadOTPRecords();
    records.unshift(record); // Add to beginning of array
    
    // Keep only the last 100 records
    const trimmedRecords = records.slice(0, 100);
    
    await AsyncStorage.setItem(OTP_RECORDS_KEY, JSON.stringify(trimmedRecords));
  } catch (error) {
    console.error('Error saving OTP record:', error);
    throw error;
  }
};

/**
 * Load OTP records from AsyncStorage
 */
export const loadOTPRecords = async (): Promise<OTPRecord[]> => {
  try {
    const recordsStr = await AsyncStorage.getItem(OTP_RECORDS_KEY);
    if (recordsStr) {
      const records = JSON.parse(recordsStr);
      // Convert string timestamps back to Date objects
      return records.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading OTP records:', error);
    return [];
  }
};

/**
 * Update OTP record in AsyncStorage
 */
export const updateOTPRecord = async (updatedRecord: OTPRecord): Promise<void> => {
  try {
    const records = await loadOTPRecords();
    const index = records.findIndex(record => record.id === updatedRecord.id);
    
    if (index !== -1) {
      records[index] = updatedRecord;
      await AsyncStorage.setItem(OTP_RECORDS_KEY, JSON.stringify(records));
    }
  } catch (error) {
    console.error('Error updating OTP record:', error);
    throw error;
  }
};

/**
 * Clear all OTP records
 */
export const clearOTPRecords = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(OTP_RECORDS_KEY);
  } catch (error) {
    console.error('Error clearing OTP records:', error);
    throw error;
  }
};