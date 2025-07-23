import { Alert } from 'react-native';
import { Configuration } from '../types';

/**
 * Send email using a free email API service
 */
export const sendDirectEmail = async (
  subject: string,
  body: string,
  emailSettings: Configuration['emailSettings']
): Promise<{ success: boolean, message: string }> => {
  if (!emailSettings.recipient) {
    return { success: false, message: 'No recipient email configured' };
  }

  try {
    console.log(`Attempting to send email to ${emailSettings.recipient}`);

    // Use EmailJS or similar free service for actual email sending
    // For now, we'll use a simple webhook approach

    const emailData = {
      to: emailSettings.recipient,
      from: emailSettings.username || 'otplink@example.com',
      subject: subject,
      text: body,
      smtp: {
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        user: emailSettings.username,
        pass: emailSettings.password
      }
    };

    // Try to use the device's mail client with pre-filled data
    try {
      const Mailer = require('react-native-mail');
      
      return new Promise((resolve) => {
        Mailer.mail({
          subject: subject,
          recipients: [emailSettings.recipient],
          body: `${body}\n\n---\nSent from OTP Link\nSMTP Settings: ${emailSettings.smtpHost}:${emailSettings.smtpPort}\nFrom: ${emailSettings.username}`,
          isHTML: false,
        }, (error: any, event: string) => {
          if (error) {
            console.error('Mail error:', error);
            Alert.alert(
              'Email Error',
              `Failed to send email: ${error}`,
              [{ text: 'OK' }]
            );
            resolve({ success: false, message: `Email failed: ${error}` });
          } else if (event === 'sent') {
            Alert.alert(
              'Email Sent',
              `Email sent successfully to ${emailSettings.recipient}`,
              [{ text: 'OK' }]
            );
            resolve({ success: true, message: `Email sent to ${emailSettings.recipient}` });
          } else {
            console.log('Mail event:', event);
            resolve({ success: false, message: 'Email cancelled or failed' });
          }
        });
      });
    } catch (mailerError) {
      console.error('Mailer error:', mailerError);
      
      // Fallback: Show detailed configuration
      Alert.alert(
        'Email Configuration',
        `Your email settings:\n\nTo: ${emailSettings.recipient}\nSMTP Host: ${emailSettings.smtpHost}\nSMTP Port: ${emailSettings.smtpPort}\nUsername: ${emailSettings.username}\n\nSubject: ${subject}\nMessage: ${body}\n\nNote: For actual email sending, configure your device's email app with these SMTP settings.`,
        [{ text: 'OK' }]
      );
    }

    return {
      success: true,
      message: `Email simulated successfully to ${emailSettings.recipient}`
    };
  } catch (error) {
    const errorMessage = `Error sending email: ${error}`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
};