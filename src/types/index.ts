export interface OTPRecord {
  id: string;
  otp: string;
  source: 'sms' | 'email' | 'webhook' | 'manual';
  sender: string;
  message: string;
  timestamp: Date;
  forwarded: boolean;
  forwardingMethod: 'webhook' | 'email' | 'api' | null;
}

export interface Configuration {
  keywords: string[];
  otpMinLength: number;
  otpMaxLength: number;
  webhookUrl: string;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    recipient: string;
  };
}

export type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  KeywordManager: undefined;
};