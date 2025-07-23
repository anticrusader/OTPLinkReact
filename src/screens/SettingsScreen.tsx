import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configuration = await loadConfiguration();
        setConfig(configuration);
        setWebhookEnabled(!!configuration.webhookUrl);
        setEmailEnabled(!!configuration.emailSettings.recipient);
        setLoading(false);
      } catch (error) {
        console.error('Error loading configuration:', error);
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

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
      // Validate webhook URL if enabled
      if (webhookEnabled && !config.webhookUrl) {
        Alert.alert('Validation Error', 'Please enter a webhook URL');
        return;
      }

      // Validate email settings if enabled
      if (emailEnabled) {
        if (!config.emailSettings.recipient) {
          Alert.alert('Validation Error', 'Please enter a recipient email address');
          return;
        }
        if (!config.emailSettings.smtpHost) {
          Alert.alert('Validation Error', 'Please enter an SMTP host');
          return;
        }
      }

      // Clear webhook URL if disabled
      if (!webhookEnabled) {
        config.webhookUrl = '';
      }

      // Clear email settings if disabled
      if (!emailEnabled) {
        config.emailSettings = {
          ...config.emailSettings,
          recipient: '',
        };
      }

      await saveConfiguration(config);
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
    <ScrollView style={styles.container}>
      {/* OTP Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>OTP Settings</Title>
          
          <View style={styles.inputRow}>
            <TextInput
              label="Minimum OTP Length"
              value={config.otpMinLength.toString()}
              onChangeText={(value) => updateConfig('otpMinLength', parseInt(value) || 4)}
              keyboardType="numeric"
              style={styles.inputHalf}
            />
            <TextInput
              label="Maximum OTP Length"
              value={config.otpMaxLength.toString()}
              onChangeText={(value) => updateConfig('otpMaxLength', parseInt(value) || 8)}
              keyboardType="numeric"
              style={styles.inputHalf}
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

      {/* Webhook Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.settingHeader}>
            <Title>Webhook Forwarding</Title>
            <Switch
              value={webhookEnabled}
              onValueChange={setWebhookEnabled}
            />
          </View>
          
          {webhookEnabled && (
            <>
              <TextInput
                label="Webhook URL"
                value={config.webhookUrl}
                onChangeText={(value) => updateConfig('webhookUrl', value)}
                placeholder="https://example.com/webhook"
                style={styles.input}
              />
              
              <Button
                mode="outlined"
                onPress={testWebhook}
                style={styles.button}
                disabled={!config.webhookUrl}
              >
                Test Webhook
              </Button>
            </>
          )}
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
              />
              
              <TextInput
                label="SMTP Host"
                value={config.emailSettings.smtpHost}
                onChangeText={(value) => updateConfig('email.smtpHost', value)}
                placeholder="smtp.example.com"
                style={styles.input}
              />
              
              <View style={styles.inputRow}>
                <TextInput
                  label="SMTP Port"
                  value={config.emailSettings.smtpPort.toString()}
                  onChangeText={(value) => updateConfig('email.smtpPort', parseInt(value) || 587)}
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />
              </View>
              
              <TextInput
                label="SMTP Username"
                value={config.emailSettings.username}
                onChangeText={(value) => updateConfig('email.username', value)}
                placeholder="username"
                style={styles.input}
              />
              
              <TextInput
                label="SMTP Password"
                value={config.emailSettings.password}
                onChangeText={(value) => updateConfig('email.password', value)}
                secureTextEntry
                placeholder="password"
                style={styles.input}
              />
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputHalf: {
    width: '48%',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
  },
  saveButton: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#6200ee',
  },
});

export default SettingsScreen;