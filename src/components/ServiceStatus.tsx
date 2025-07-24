import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Configuration } from '../types';

interface ServiceStatusProps {
  config: Configuration;
  smsListenerActive: boolean;
}

const ServiceStatus: React.FC<ServiceStatusProps> = ({ config, smsListenerActive }) => {
  const theme = useTheme();
  const emailEnabled = !!config.emailSettings.recipient;

  const StatusBadge = ({ active, label }: { active: boolean; label: string }) => (
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

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Service Status</Text>
        
        <View style={styles.statusItem}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>SMS Listener</Text>
            <StatusBadge active={smsListenerActive} label={smsListenerActive ? 'Active' : 'Inactive'} />
          </View>
        </View>
        

        <View style={styles.statusItem}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>Email Forwarding</Text>
            <StatusBadge active={emailEnabled} label={emailEnabled ? 'Enabled' : 'Disabled'} />
          </View>
          {emailEnabled && (
            <Text style={[styles.statusDescription, { color: theme.colors.onSurfaceVariant }]}>{config.emailSettings.recipient}</Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusItem: {
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
  statusDescription: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 0,
    fontWeight: '400',
  },
});

export default ServiceStatus;