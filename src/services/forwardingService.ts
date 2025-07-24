import { Alert } from 'react-native';
import { OTPRecord, Configuration } from '../types';
import { updateOTPRecord } from './storageService';
import { sendDirectEmail } from './directEmailService';

/**
 * Forward OTP via webhook
 */
export const forwardViaWebhook = async (
  otpRecord: OTPRecord,
  webhookUrl: string
): Promise<boolean> => {
  if (!webhookUrl) {
    console.error('Webhook URL is not configured');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: otpRecord.otp,
        sender: otpRecord.sender,
        message: otpRecord.message,
        timestamp: otpRecord.timestamp.toISOString(),
      }),
    });

    if (response.ok) {
      // Update OTP record
      const updatedRecord: OTPRecord = {
        ...otpRecord,
        forwarded: true,
        forwardingMethod: 'webhook',
      };
      await updateOTPRecord(updatedRecord);
      return true;
    } else {
      console.error('Webhook forwarding failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error forwarding via webhook:', error);
    return false;
  }
};

/**
 * Forward OTP via email
 */
export const forwardViaEmail = async (
  otpRecord: OTPRecord,
  emailSettings: Configuration['emailSettings']
): Promise<boolean> => {
  if (!emailSettings.recipient) {
    console.error('Email recipient is not configured');
    return false;
  }

  try {
    console.log('Forwarding OTP via email:', otpRecord);

    // Create email subject and body
    const subject = `OTPLink - OTP: ${otpRecord.otp} from ${otpRecord.sender}`;
    const body = `OTP: ${otpRecord.otp}\nFrom: ${otpRecord.sender}\nMessage: ${otpRecord.message}\nTime: ${otpRecord.timestamp.toLocaleString()}\n\nSent by OTPLink App`;

    // Try to send via direct email first
    if (emailSettings.recipient) {
      console.log('Using direct email service');
      const emailResponse = await sendDirectEmail(subject, body, emailSettings);

      if (emailResponse.success) {
        // Update OTP record
        const updatedRecord: OTPRecord = {
          ...otpRecord,
          forwarded: true,
          forwardingMethod: 'email',
        };
        await updateOTPRecord(updatedRecord);
        return true;
      } else {
        // Show error alert with details
        Alert.alert(
          'Email Failed',
          emailResponse.message,
          [{ text: 'OK' }]
        );
      }

      console.log('Direct email failed, falling back to mail app');
    }

    // Fall back to showing alert with email details since react-native-mail might not be available
    console.log('Showing email details in alert');
    
    Alert.alert(
      'OTP Forwarded',
      `OTP: ${otpRecord.otp}\nTo: ${emailSettings.recipient}\nFrom: ${otpRecord.sender}\nMessage: ${otpRecord.message}\nTime: ${otpRecord.timestamp.toLocaleString()}`,
      [{ text: 'OK' }]
    );
    
    // Update record as forwarded
    const updatedRecord: OTPRecord = {
      ...otpRecord,
      forwarded: true,
      forwardingMethod: 'email',
    };
    await updateOTPRecord(updatedRecord);
    return true;
  } catch (error) {
    console.error('Error forwarding via email:', error);
    return false;
  }
};

/**
 * Forward OTP using configured methods
 */
export const forwardOTP = async (
  otpRecord: OTPRecord,
  config: Configuration
): Promise<boolean> => {
  let forwarded = false;

  // Try webhook forwarding
  if (config.webhookUrl) {
    const webhookResult = await forwardViaWebhook(otpRecord, config.webhookUrl);
    forwarded = forwarded || webhookResult;
  }

  // Try email forwarding
  if (config.emailSettings.recipient) {
    const emailResult = await forwardViaEmail(otpRecord, config.emailSettings);
    forwarded = forwarded || emailResult;
  }

  return forwarded;
};