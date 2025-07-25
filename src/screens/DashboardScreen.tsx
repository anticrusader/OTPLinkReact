import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Divider,
  Switch
} from 'react-native-paper';
import { NativeModules } from 'react-native';

const { SmsTestModule } = NativeModules;
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
  const insets = useSafeAreaInsets();
  
  const {
    otpRecords,
    config,
    loading,
    smsListenerActive,
    loadData,
    initSmsListener,
    stopSmsListener
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

  // Custom Status Badge Component (same as ServiceStatus)
  const StatusBadge = ({ active, label, icon }: { active: boolean; label: string; icon?: string }) => (
    <View style={[
      styles.statusBadge,
      { backgroundColor: active ? '#E8F5E9' : '#FFF3E0' }
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: active ? '#4CAF50' : '#FF9800' }
      ]} />
      <Text style={[
        styles.statusText,
        { color: active ? '#2E7D32' : '#E65100' }
      ]}>
        {label}
      </Text>
    </View>
  );

  // Custom Method Badge Component
  const MethodBadge = ({ method }: { method: string }) => (
    <View style={[
      styles.statusBadge,
      { backgroundColor: '#E3F2FD' }
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: '#1565C0' }
      ]} />
      <Text style={[
        styles.statusText,
        { color: '#1565C0' }
      ]}>
        Via {method}
      </Text>
    </View>
  );

  // Custom Button Component
  const CustomButton = ({ title, onPress, mode = 'contained', icon }: { 
    title: string; 
    onPress: () => void; 
    mode?: 'contained' | 'outlined'; 
    icon?: string;
  }) => (
    <View style={[
      styles.customButton,
      { backgroundColor: mode === 'contained' ? '#6750A4' : 'transparent' },
      mode === 'outlined' && { borderWidth: 1, borderColor: '#6750A4' }
    ]}>
      <Button
        mode="text"
        onPress={onPress}
        textColor={mode === 'contained' ? '#FFFFFF' : '#6750A4'}
        icon={icon}
        contentStyle={styles.buttonContent}
      >
        {title}
      </Button>
    </View>
  );

  // Render OTP record item
  const renderOtpItem = ({ item }: { item: OTPRecord }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.otpHeader}>
          <Title style={styles.otpCode}>{item.otp}</Title>
          <StatusBadge 
            active={item.forwarded} 
            label={item.forwarded ? 'Forwarded' : 'Pending'} 
          />
        </View>
        
        <Paragraph style={styles.sender}>From: {item.sender}</Paragraph>
        <Paragraph style={styles.message}>{item.message}</Paragraph>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        
        {item.forwarded && item.forwardingMethod && (
          <MethodBadge method={item.forwardingMethod} />
        )}
        
        {!item.forwarded && config && (
          <CustomButton
            title="Forward Now"
            mode="contained"
            icon="send"
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
          />
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
            </View>
          )}
          
          <View style={styles.smsToggleContainer}>
            <Card style={styles.toggleCard}>
              <Card.Content>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>SMS Listener</Text>
                    <Text style={styles.toggleDescription}>
                      {smsListenerActive ? 'Monitoring SMS messages for OTPs' : 'SMS monitoring is disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={smsListenerActive}
                    onValueChange={async (value) => {
                      console.log('Toggle switch changed to:', value);
                      
                      if (value) {
                        // Start SMS listener
                        console.log('Starting SMS listener...');
                        try {
                          const result = await initSmsListener();
                          console.log('SMS listener start result:', result);
                          
                          if (!result) {
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
                          console.error('Error starting SMS listener:', error);
                          Alert.alert(
                            'Activation Error',
                            'An error occurred while activating the SMS listener.',
                            [{ text: 'OK' }]
                          );
                        }
                      } else {
                        // Stop SMS listener
                        console.log('Stopping SMS listener...');
                        try {
                          const result = await stopSmsListener();
                          console.log('SMS listener stop result:', result);
                          
                          // Force refresh the status
                          await loadData();
                        } catch (error) {
                          console.error('Error stopping SMS listener:', error);
                        }
                      }
                    }}
                  />
                </View>
              </Card.Content>
            </Card>
            

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
              contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={true}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      )}
      
      <FAB
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        icon={({ size, color }) => (
          <Text style={{ 
            fontSize: size * 0.6, 
            color, 
            textAlign: 'center',
            lineHeight: size * 0.9
          }}>⚙️</Text>
        )}
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
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
    borderRadius: 24,
  },
  settingsButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 24,
  },
  fullWidthButton: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
  },
  refreshButton: {
    marginHorizontal: 16,
    marginTop: 0,
    borderRadius: 24,
  },
  buttonContent: {
    height: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    justifyContent: 'center',
    elevation: 1,
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  customButton: {
    borderRadius: 24,
    marginTop: 8,
    marginHorizontal: 16,
    elevation: 2,
  },

  smsToggleContainer: {
    margin: 16,
    marginTop: 0,
  },
  toggleCard: {
    elevation: 2,
    borderRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 16,
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
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
    elevation: 3,
    borderRadius: 12,
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
    marginTop: 12,
    borderRadius: 20,
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
    bottom: 20,
    elevation: 6,
  },
});

export default DashboardScreen;