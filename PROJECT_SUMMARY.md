# OTP Link - Project Summary

## Overview

OTP Link is a React Native application for Android and iOS that automatically detects and forwards OTPs (One-Time Passwords) received via SMS. The app is designed to help users who need to relay OTPs to other services or devices.

## Project Structure

```
OTPLink/
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── App.tsx                # Main app component
└── index.js               # Entry point
```

## Key Features

1. **SMS OTP Detection**
   - Automatically listens for incoming SMS messages
   - Uses regex patterns to extract OTPs
   - Filters messages based on configurable keywords

2. **OTP Forwarding**
   - Webhook forwarding to any HTTP endpoint
   - Email forwarding via device's email client
   - Manual forwarding option

3. **Dashboard**
   - Real-time display of received OTPs
   - Status indicators for all services
   - One-tap manual forwarding

4. **Configuration**
   - Customizable OTP patterns and lengths
   - Keyword management for filtering messages
   - Webhook and email settings

## Technical Implementation

### OTP Detection

The app uses a set of regex patterns to extract OTPs from SMS messages. It also filters messages based on keywords like "otp", "code", "verification", etc. The OTP detection logic is implemented in `src/utils/otpUtils.ts`.

### SMS Listening

On Android, the app uses the `react-native-sms-retriever` package to listen for incoming SMS messages without requiring direct SMS read access. This provides a more privacy-friendly approach to OTP detection.

### Data Storage

The app uses `@react-native-async-storage/async-storage` to store:
- OTP records history
- User configuration
- Forwarding settings

### UI Framework

The app uses React Native Paper for its UI components, providing a Material Design look and feel.

## Future Enhancements

1. **Additional Input Methods**
   - Email OTP detection
   - Push notification OTP detection

2. **Advanced Forwarding**
   - Custom API integrations
   - Scheduled forwarding
   - Conditional forwarding rules

3. **Security Features**
   - Encryption for stored OTPs
   - App lock with biometric authentication
   - Automatic OTP expiry

4. **Analytics**
   - OTP source statistics
   - Forwarding success rates
   - Pattern matching effectiveness