import { Platform, PermissionsAndroid, Alert } from 'react-native';

/**
 * Request all required permissions directly
 */
export const requestAllPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    console.log('Requesting all required permissions...');
    
    // Request READ_SMS permission
    const readSmsResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Read Permission',
        message: 'OTP Link needs to read your SMS messages to detect OTPs.',
        buttonPositive: 'Allow',
      }
    );
    
    // Request RECEIVE_SMS permission
    const receiveSmsResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'SMS Receive Permission',
        message: 'OTP Link needs to receive SMS notifications to detect OTPs.',
        buttonPositive: 'Allow',
      }
    );
    
    // Request POST_NOTIFICATIONS permission on Android 13+
    let notificationResult = PermissionsAndroid.RESULTS.GRANTED;
    if (parseInt(Platform.Version.toString(), 10) >= 33) {
      notificationResult = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS',
        {
          title: 'Notification Permission',
          message: 'OTP Link needs to show notifications for detected OTPs.',
          buttonPositive: 'Allow',
        }
      );
    }
    
    const allGranted = 
      readSmsResult === PermissionsAndroid.RESULTS.GRANTED &&
      receiveSmsResult === PermissionsAndroid.RESULTS.GRANTED &&
      notificationResult === PermissionsAndroid.RESULTS.GRANTED;
    
    console.log('Permission results:', {
      readSms: readSmsResult,
      receiveSms: receiveSmsResult,
      notification: notificationResult,
      allGranted
    });
    
    return allGranted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};