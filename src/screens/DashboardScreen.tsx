import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Button, 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  Text, 
  ActivityIndicator,
  Chip,
  Divider
} from 'react-native-paper';
import { ServiceStatus } from '../components';
import { RootStackParamList, OTPRecord } from '../types';
import { forwardOTP } from '../services/forwardingService';
import { useOtpProcessor } from '../hooks';
import * as SmsService from '../services/simpleSmsService';
import { requestAllPermissions } from '../services/permissionService';
import { Linking, PermissionsAndroid } from 'react-native';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    otpRecords,
    config,
    loading,
    smsListenerActive,
    loadData,
    initSmsListener
  } = useOtpProcessor();

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Initialize on mount
  useEffect(() => {
    // Focus listener to refresh data when returning to screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation, loadData]);

  // Render OTP record item
  const renderOtpItem = ({ item }: { item: OTPRecord }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.otpHeader}>
          <Title style={styles.otpCode}>{item.otp}</Title>
          <Chip 
            icon={item.forwarded ? 'check' : 'clock-outline'}
            mode="outlined"
            style={{ 
              backgroundColor: item.forwarded ? '#e8f5e9' : '#fff3e0',
            }}
          >
            {item.forwarded ? 'Forwarded' : 'Pending'}
          </Chip>
        </View>
        
        <Paragraph style={styles.sender}>From: {item.sender}</Paragraph>
        <Paragraph style={styles.message}>{item.message}</Paragraph>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        
        {item.forwarded && item.forwardingMethod && (
          <Chip icon="send" style={styles.methodChip}>
            Via {item.forwardingMethod}
          </Chip>
        )}
        
        {!item.forwarded && config && (
          <Button 
            mode="contained" 
            onPress={async () => {
              if (config) {
                try {
                  const result = await forwardOTP(item, config);
                  if (result) {
                    Alert.alert(
                      'Success',
                      'OTP forwarded successfully!',
                      [{ text: 'OK' }]
                    );
                    loadData(); // Refresh data after forwarding
                  } else {
                    Alert.alert(
                      'Error',
                      'Failed to forward OTP. Please check your settings.',
                      [{ text: 'OK' }]
                    );
                  }
                } catch (error) {
                  console.error('Error forwarding OTP:', error);
                  Alert.alert(
                    'Error',
                    'An error occurred while forwarding the OTP.',
                    [{ text: 'OK' }]
                  );
                }
              }
            }}
            style={styles.forwardButton}
          >
            Forward Now
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading OTPs...</Text>
        </View>
      ) : (
        <>
          {config && (
            <View>
              <ServiceStatus 
                config={config} 
                smsListenerActive={smsListenerActive} 
              />
              <Button 
                mode="text" 
                onPress={async () => {
                  console.log('Refreshing status...');
                  await loadData();
                  const status = await SmsService.getSmsStatus();
                  console.log('Current SMS status:', status);
                }}
                style={styles.refreshButton}
                icon="refresh"
              >
                Refresh Status
              </Button>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            {!smsListenerActive && (
              <Button 
                mode="contained" 
                onPress={async () => {
                  console.log('Activate SMS Listener button pressed');
                  
                  try {
                    // Start the listener directly
                    const result = await initSmsListener();
                    console.log('SMS Listener initialization result:', result);
                    
                    if (result) {
                      Alert.alert(
                        'SMS Listener Activated',
                        'The app is now monitoring for incoming OTP messages.',
                        [{ text: 'OK' }]
                      );
                    } else {
                      Alert.alert(
                        'Activation Failed',
                        'Failed to activate SMS listener. Please check permissions in settings.',
                        [
                          { text: 'OK' },
                          { 
                            text: 'Open Settings', 
                            onPress: () => Linking.openSettings() 
                          }
                        ]
                      );
                    }
                  } catch (error) {
                    console.error('Error activating SMS listener:', error);
                    Alert.alert(
                      'Activation Error',
                      'An error occurred while activating the SMS listener.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                style={styles.activateButton}
                icon="cellphone-message"
              >
                Activate SMS Listener
              </Button>
            )}
            
            <Button 
              mode="outlined" 
              onPress={async () => {
                const status = await SmsService.getSmsStatus();
                Alert.alert(
                  'SMS Status Debug',
                  `Permissions: ${status.hasPermissions}\nListener Active: ${status.isListenerActive}\nPlatform: ${status.platform}`,
                  [
                    { text: 'OK' },
                    { text: 'Test OTP', onPress: () => SmsService.testOtpDetection('Your OTP is 123456 for verification') },
                    { text: 'Test Real SMS', onPress: () => SmsService.testRealSms() },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                  ]
                );
              }}
              style={smsListenerActive ? styles.fullWidthButton : styles.settingsButton}
              icon="information"
            >
              Debug Status
            </Button>
          </View>
          
          <Divider style={styles.divider} />
          
          {otpRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No OTPs received yet</Text>
              <Text style={styles.emptySubtext}>
                OTPs will appear here when received
              </Text>
            </View>
          ) : (
            <FlatList
              data={otpRecords}
              renderItem={renderOtpItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
          
          <FAB
            style={styles.fab}
            icon="cog"
            onPress={() => navigation.navigate('Settings')}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 0,
  },
  activateButton: {
    flex: 1,
    marginRight: 8,
  },
  settingsButton: {
    flex: 1,
    marginLeft: 8,
  },
  fullWidthButton: {
    flex: 1,
    margin: 16,
  },
  refreshButton: {
    marginHorizontal: 16,
    marginTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpCode: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  methodChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  forwardButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default DashboardScreen;