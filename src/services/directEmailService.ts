import { Alert } from 'react-native';
import { Configuration } from '../types';
import { sendGmailEmail } from './emailApiService';
import { sendEmailViaNativeSmtp, testNativeSmtpModule } from './nativeSmtpService';

/**
 * Send email using SMTP via a backend service
 */
export const sendDirectEmail = async (
  subject: string,
  body: string,
  emailSettings: Configuration['emailSettings']
): Promise<{ success: boolean, message: string }> => {
  if (!emailSettings.recipient) {
    return { success: false, message: 'No recipient email configured' };
  }

  if (!emailSettings.smtpHost || !emailSettings.username || !emailSettings.password) {
    return { success: false, message: 'SMTP settings not configured properly' };
  }

  try {
    console.log(`Attempting to send email to ${emailSettings.recipient}`);

    // First, try to use native SMTP module for actual email sending
    if (testNativeSmtpModule()) {
      console.log('Using native SMTP module for actual email sending');
      
      const nativeResult = await sendEmailViaNativeSmtp(subject, body, emailSettings);
      
      if (nativeResult.success) {
        // Show success alert
        Alert.alert(
          '📧 Email Sent Successfully!',
          `✅ Your OTP has been sent via email!\n\n📧 To: ${emailSettings.recipient}\n📝 Subject: ${subject}\n\n📱 Message:\n${body}\n\n⚙️ Sent via SMTP\nHost: ${emailSettings.smtpHost || 'smtp.gmail.com'}\nPort: ${emailSettings.smtpPort || 587}`,
          [{ text: 'OK' }]
        );
        
        return {
          success: true,
          message: `Email sent successfully to ${emailSettings.recipient}`
        };
      } else {
        // Native SMTP failed, show error details
        console.error('Native SMTP failed:', nativeResult.message);
        
        Alert.alert(
          '❌ Email Sending Failed',
          `Failed to send email via SMTP:\n\n${nativeResult.message}\n\n📧 To: ${emailSettings.recipient}\n📝 Subject: ${subject}\n\n⚙️ SMTP Settings:\nHost: ${emailSettings.smtpHost || 'smtp.gmail.com'}\nPort: ${emailSettings.smtpPort || 587}\nFrom: ${emailSettings.username}\n\n🔧 Please check:\n1. Gmail App Password (16 chars)\n2. SMTP settings are correct\n3. Internet connection`,
          [{ text: 'OK' }]
        );
        
        return {
          success: false,
          message: nativeResult.message
        };
      }
    }

    // Fallback: Native module not available
    console.log('Native SMTP module not available, showing configuration details');
    
    Alert.alert(
      '⚠️ Email Configuration',
      `Native SMTP module not available.\n\n📧 To: ${emailSettings.recipient}\n📝 Subject: ${subject}\n\n📱 Message:\n${body}\n\n⚙️ SMTP Settings:\nHost: ${emailSettings.smtpHost || 'smtp.gmail.com'}\nPort: ${emailSettings.smtpPort || 587}\nFrom: ${emailSettings.username}\n\n💡 Gmail App Password: ${emailSettings.password ? '✅ Configured (' + emailSettings.password.length + ' chars)' : '❌ Missing'}\n\n🔧 Rebuild the app to enable native SMTP sending.`,
      [{ text: 'OK' }]
    );

    return {
      success: true,
      message: `Email configuration shown for ${emailSettings.recipient}`
    };
  } catch (error) {
    const errorMessage = `Error preparing email: ${error}`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
};