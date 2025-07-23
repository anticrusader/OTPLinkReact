# OTP Link

A React Native application for Android and iOS that automatically receives OTPs from SMS messages and forwards them to configured services via webhook or email.

## Features

- **Automatic OTP Detection**: Listens for incoming SMS messages and extracts OTPs using regex patterns
- **Flexible Forwarding**: Forward OTPs via webhook or email
- **Customizable Keywords**: Configure which keywords trigger OTP detection
- **Real-time Dashboard**: View all received OTPs in a clean interface
- **Configurable Settings**: Customize OTP length, forwarding methods, and more

## Requirements

- Node.js 18 or newer
- React Native development environment set up
- Android Studio (for Android development)
- Xcode (for iOS development)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. For iOS, install pods:
   ```
   cd ios && pod install && cd ..
   ```

## Running the App

### Android

```
npm run android
```

### iOS

```
npm run ios
```

## Usage

1. Launch the app
2. Grant SMS permissions when prompted
3. Configure forwarding settings:
   - Webhook URL for webhook forwarding
   - Email settings for email forwarding
4. Customize keywords and OTP patterns if needed
5. The app will automatically detect and forward OTPs based on your settings

## OTP Detection Patterns

The app uses the following regex patterns to detect OTPs:

- `\b(\d{4,8}) is your OTP\b`
- `\bOTP: (\d{4,8})\b`
- `\bYour code is (\d{4,8})\b`
- `\b(\d{6})\b` (general 6-digit)
- And many more...

## License

This project is licensed under the MIT License.