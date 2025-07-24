import { NativeModules, DeviceEventEmitter } from 'react-native';
import { processMessage } from '../utils/otpUtils';
import { loadConfiguration, saveOTPRecord } from './storageService';
import { OTPRecord } from '../types';

let smsListener: any = null;

/**
 * Start listening for SMS messages using device events
 */
export const startRealSmsListener = async (
  onOtpReceived: (record: OTPRecord) => void
): Promise<boolean> => {
  try {
    console.log('Starting real SMS listener...');
    
    // Remove existing listener
    if (smsListener) {
      smsListener.remove();
    }
    
    // Add SMS listener using DeviceEventEmitter
    smsListener = DeviceEventEmitter.addListener('onSMSReceived', async (message) => {
      console.log('SMS received via DeviceEventEmitter (background):', message);
      
      try {
        const config = await loadConfiguration();
        const sender = message.originatingAddress || message.address || 'Unknown';
        const body = message.messageBody || message.body || '';
        
        console.log('Processing background SMS:', { sender, body });
        
        const otpRecord = processMessage(
          sender,
          body,
          config.keywords,
          config.otpMinLength,
          config.otpMaxLength
        );
        
        if (otpRecord) {
          console.log('OTP detected from background SMS:', otpRecord);
          await saveOTPRecord(otpRecord);
          onOtpReceived(otpRecord);
          
          // Auto-forward the OTP
          try {
            const { forwardOTP } = require('./forwardingService');
            const forwarded = await forwardOTP(otpRecord, config);
            console.log('Background auto-forwarding result:', forwarded);
          } catch (forwardError) {
            console.error('Error auto-forwarding background OTP:', forwardError);
          }
        }
      } catch (error) {
        console.error('Error processing background SMS:', error);
      }
    });
    
    console.log('Real SMS listener started');
    return true;
  } catch (error) {
    console.error('Error starting real SMS listener:', error);
    return false;
  }
};

/**
 * Stop SMS listener
 */
export const stopRealSmsListener = (): void => {
  if (smsListener) {
    smsListener.remove();
    smsListener = null;
    console.log('Real SMS listener stopped');
  }
};