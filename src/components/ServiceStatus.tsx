import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, List } from 'react-native-paper';
import { Configuration } from '../types';

interface ServiceStatusProps {
  config: Configuration;
  smsListenerActive: boolean;
}

const ServiceStatus: React.FC<ServiceStatusProps> = ({ config, smsListenerActive }) => {
  const webhookEnabled = !!config.webhookUrl;
  const emailEnabled = !!config.emailSettings.recipient;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Service Status</Title>
        
        <List.Item
          title="SMS Listener"
          description={smsListenerActive ? 'Active' : 'Inactive'}
          left={props => (
            <List.Icon
              {...props}
              icon={smsListenerActive ? 'check-circle' : 'alert-circle'}
              color={smsListenerActive ? '#4caf50' : '#ff9800'}
            />
          )}
        />
        
        <List.Item
          title="Webhook Forwarding"
          description={webhookEnabled ? config.webhookUrl : 'Not configured'}
          left={props => (
            <List.Icon
              {...props}
              icon={webhookEnabled ? 'check-circle' : 'close-circle'}
              color={webhookEnabled ? '#4caf50' : '#f44336'}
            />
          )}
        />
        
        <List.Item
          title="Email Forwarding"
          description={emailEnabled ? config.emailSettings.recipient : 'Not configured'}
          left={props => (
            <List.Icon
              {...props}
              icon={emailEnabled ? 'check-circle' : 'close-circle'}
              color={emailEnabled ? '#4caf50' : '#f44336'}
            />
          )}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
  },
});

export default ServiceStatus;