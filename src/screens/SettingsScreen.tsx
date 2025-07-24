import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Title,
  TextInput,
  Switch,
  Text,
  Divider,
  List,
  Snackbar,
} from 'react-native-paper';
import { RootStackParamList, Configuration } from '../types';
import { loadConfiguration, saveConfiguration } from '../services/storageService';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [config, setConfig] = useState<Configuration | null>(null);
  const [originalConfig, setOriginalConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configuration = await loadConfiguration();
        setConfig(configuration);
        setOriginalConfig(JSON.parse(JSON.stringify(configuration))); // Deep copy
        setEmailEnabled(!!configuration.emailSettings.recipient);
        setLoading(false);
      } catch (error) {
        console.error('Error loading configuration:', error);
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      // Check if there are unsaved changes
      if (config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig)) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Do you want to save them before leaving?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Save',
              onPress: async () => {
                await saveConfig();
                navigation.goBack();
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    // Also handle navigation back button
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig)) {
        e.preventDefault();
        backAction();
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, config, originalConfig]);

  // Update configuration field
  const updateConfig = (field: string, value: any) => {
    if (!config) return;

    if (field.startsWith('email.')) {
      const emailField = field.split('.')[1];
      setConfig({
        ...config,
        emailSettings: {
          ...config.emailSettings,
          [emailField]: value,
        },
      });
    } else {
      setConfig({
        ...config,
        [field]: value,
      });
    }
  };

  // Save configuration
  const saveConfig = async () => {
    if (!config) return;

    try {
      // Create a copy of config to modify
      const configToSave = { ...config };

      // Set default values for empty OTP length fields
      if (!configToSave.otpMinLength || configToSave.otpMinLength === '') {
        configToSave.otpMinLength = 4;
      }
      if (!configToSave.otpMaxLength || configToSave.otpMaxLength === '') {
        configToSave.otpMaxLength = 8;
      }

      // Validate OTP length values
      if (configToSave.otpMinLength > configToSave.otpMaxLength) {
        Alert.alert('Validation Error', 'Minimum OTP length cannot be greater than maximum length');
        return;
      }



      // Validate email settings if enabled
      if (emailEnabled) {
        if (!configToSave.emailSettings.recipient) {
          Alert.alert('Validation Error', 'Please enter a recipient email address');
          return;
        }
        if (!configToSave.emailSettings.smtpHost) {
          Alert.alert('Validation Error', 'Please enter an SMTP host');
          return;
        }
      }



      // Clear email settings if disabled
      if (!emailEnabled) {
        configToSave.emailSettings = {
          ...configToSave.emailSettings,
          recipient: '',
        };
      }

      await saveConfiguration(configToSave);
      setConfig(configToSave); // Update local state
      setOriginalConfig(JSON.parse(JSON.stringify(configToSave))); // Update original config after save
      setSnackbarMessage('Settings saved successfully');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSnackbarMessage('Failed to save settings');
      setSnackbarVisible(true);
    }
  };

  // Test webhook
  const testWebhook = async () => {
    if (!config || !config.webhookUrl) return;

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: '123456',
          sender: 'Test',
          message: 'This is a test OTP: 123456',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSnackbarMessage('Webhook test successful');
      } else {
        setSnackbarMessage(`Webhook test failed: ${response.status}`);
      }
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error testing webhook:', error);
      setSnackbarMessage('Webhook test failed');
      setSnackbarVisible(true);
    }
  };

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      {/* OTP Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>OTP Settings</Title>
          
          <View style={styles.inputRow}>
            <TextInput
              label="Minimum OTP Length"
              value={config.otpMinLength?.toString() || ''}
              onChangeText={(value) => {
                if (value === '') {
                  updateConfig('otpMinLength', '');
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
                    updateConfig('otpMinLength', numValue);
                  }
                }
              }}
              keyboardType="numeric"
              style={styles.inputHalf}
              mode="outlined"
              placeholder="4"
            />
            <TextInput
              label="Maximum OTP Length"
              value={config.otpMaxLength?.toString() || ''}
              onChangeText={(value) => {
                if (value === '') {
                  updateConfig('otpMaxLength', '');
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
                    updateConfig('otpMaxLength', numValue);
                  }
                }
              }}
              keyboardType="numeric"
              style={styles.inputHalf}
              mode="outlined"
              placeholder="8"
            />
          </View>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('KeywordManager')}
            style={styles.button}
          >
            Manage Keywords ({config.keywords.length})
          </Button>
        </Card.Content>
      </Card>



      {/* Email Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.settingHeader}>
            <Title>Email Forwarding</Title>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
            />
          </View>
          
          {emailEnabled && (
            <>
              <TextInput
                label="Recipient Email"
                value={config.emailSettings.recipient}
                onChangeText={(value) => updateConfig('email.recipient', value)}
                placeholder="recipient@example.com"
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                label="SMTP Host"
                value={config.emailSettings.smtpHost}
                onChangeText={(value) => updateConfig('email.smtpHost', value)}
                placeholder="smtp.gmail.com"
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
              />
              
              <View style={styles.inputRow}>
                <TextInput
                  label="SMTP Port"
                  value={config.emailSettings.smtpPort?.toString() || ''}
                  onChangeText={(value) => {
                    if (value === '') {
                      updateConfig('email.smtpPort', null);
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue > 0 && numValue <= 65535) {
                        updateConfig('email.smtpPort', numValue);
                      }
                    }
                  }}
                  keyboardType="numeric"
                  style={styles.inputHalf}
                  mode="outlined"
                  placeholder="587"
                />
                <View style={styles.inputHalf}>
                  <Text style={styles.helperText}>Common ports: 587 (TLS), 465 (SSL), 25 (Plain)</Text>
                </View>
              </View>
              
              <TextInput
                label="SMTP Username (Gmail Address)"
                value={config.emailSettings.username}
                onChangeText={(value) => updateConfig('email.username', value)}
                placeholder="your-email@gmail.com"
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                label="SMTP Password (App Password)"
                value={config.emailSettings.password}
                onChangeText={(value) => updateConfig('email.password', value)}
                secureTextEntry
                placeholder="16-character app password"
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
              />
              
              <Text style={styles.helperText}>
                💡 For Gmail: Use your 16-character App Password, not your regular password
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={saveConfig}
        style={styles.saveButton}
      >
        Save Settings
      </Button>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for keyboard
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    borderRadius: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  inputHalf: {
    width: '48%',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 16,
  },
  button: {
    marginTop: 8,
  },
  saveButton: {
    margin: 16,
    marginTop: 8,
    borderRadius: 24,
  },
});

export default SettingsScreen;