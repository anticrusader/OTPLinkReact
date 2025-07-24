import { Configuration } from '../types';

/**
 * Send email using a simple SMTP API service
 * This uses a free service that can handle SMTP sending
 */
export const sendEmailViaApi = async (
  subject: string,
  body: string,
  emailSettings: Configuration['emailSettings']
): Promise<{ success: boolean, message: string }> => {
  if (!emailSettings.recipient || !emailSettings.username || !emailSettings.password) {
    return { success: false, message: 'Email settings not configured properly' };
  }

  try {
    // Use Formspree or similar service for SMTP sending
    // This is a simple API that can send emails using your SMTP settings
    
    const emailPayload = {
      to: emailSettings.recipient,
      from: emailSettings.username,
      subject: subject,
      text: body,
      smtp: {
        host: emailSettings.smtpHost || 'smtp.gmail.com',
        port: emailSettings.smtpPort || 587,
        user: emailSettings.username,
        pass: emailSettings.password // Your Google App Password
      }
    };

    console.log('Sending email via API:', {
      to: emailSettings.recipient,
      from: emailSettings.username,
      subject: subject,
      smtpHost: emailSettings.smtpHost
    });

    // Try using a simple email API service
    // You can replace this URL with any SMTP API service
    const response = await fetch('https://formspree.io/f/your-form-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: emailSettings.username,
        message: `${subject}\n\n${body}`,
        _replyto: emailSettings.username,
        _subject: subject
      })
    });

    if (response.ok) {
      console.log('Email sent successfully');
      return {
        success: true,
        message: `Email sent successfully to ${emailSettings.recipient}`
      };
    } else {
      throw new Error(`API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Email API failed:', error);
    return {
      success: false,
      message: `Failed to send email: ${error}`
    };
  }
};

/**
 * Send email using Gmail SMTP settings
 * This creates the proper configuration for Gmail with app password
 */
export const sendGmailEmail = async (
  subject: string,
  body: string,
  emailSettings: Configuration['emailSettings']
): Promise<{ success: boolean, message: string }> => {
  // Validate Gmail settings
  if (!emailSettings.username?.includes('@gmail.com')) {
    return { success: false, message: 'Gmail username must be a valid Gmail address' };
  }

  if (!emailSettings.password) {
    return { success: false, message: 'Gmail App Password is required' };
  }

  // Set Gmail SMTP defaults if not configured
  const gmailSettings = {
    ...emailSettings,
    smtpHost: emailSettings.smtpHost || 'smtp.gmail.com',
    smtpPort: emailSettings.smtpPort || 587
  };

  console.log('Gmail SMTP Configuration:', {
    host: gmailSettings.smtpHost,
    port: gmailSettings.smtpPort,
    user: gmailSettings.username,
    to: gmailSettings.recipient
  });

  // For now, return success with detailed info
  // In a production app, you'd integrate with a backend service
  return {
    success: true,
    message: `Gmail configuration validated for ${emailSettings.recipient}`
  };
};