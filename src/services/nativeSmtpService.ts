import { NativeModules } from 'react-native';
import { Configuration } from '../types';

const { SmtpModule } = NativeModules;

/**
 * Send email using native Android SMTP implementation
 */
export const sendEmailViaNativeSmtp = async (
  subject: string,
  body: string,
  emailSettings: Configuration['emailSettings']
): Promise<{ success: boolean, message: string }> => {
  if (!SmtpModule) {
    console.error('SmtpModule not available');
    return { success: false, message: 'Native SMTP module not available' };
  }

  if (!emailSettings.recipient || !emailSettings.username || !emailSettings.password) {
    return { success: false, message: 'Email settings not configured properly' };
  }

  try {
    console.log('Sending email via native SMTP:', {
      to: emailSettings.recipient,
      from: emailSettings.username,
      subject: subject,
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort
    });

    const emailData = {
      host: emailSettings.smtpHost || 'smtp.gmail.com',
      port: emailSettings.smtpPort || 587,
      username: emailSettings.username,
      password: emailSettings.password,
      to: emailSettings.recipient,
      subject: subject,
      body: body
    };

    const result = await SmtpModule.sendEmail(emailData);
    console.log('Native SMTP result:', result);

    return {
      success: true,
      message: result
    };
  } catch (error) {
    console.error('Native SMTP error:', error);
    return {
      success: false,
      message: `SMTP Error: ${error}`
    };
  }
};

/**
 * Test native SMTP module availability
 */
export const testNativeSmtpModule = (): boolean => {
  const available = !!SmtpModule;
  console.log('Native SMTP module available:', available);
  return available;
};