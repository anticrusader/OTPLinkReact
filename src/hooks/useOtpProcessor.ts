import { useState, useEffect, useCallback } from 'react';
import { OTPRecord, Configuration } from '../types';
import { loadOTPRecords, loadConfiguration, saveConfiguration } from '../services/storageService';
import * as SmsService from '../services/simpleSmsService';
import { requestAllPermissions } from '../services/permissionService';
import { forwardOTP } from '../services/forwardingService';

export const useOtpProcessor = () => {
  const [otpRecords, setOtpRecords] = useState<OTPRecord[]>([]);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsListenerActive, setSmsListenerActive] = useState(false);

  // Load OTP records and configuration
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const records = await loadOTPRecords();
      const configuration = await loadConfiguration();
      
      setOtpRecords(records);
      setConfig(configuration);
      
      // Update SMS listener state based on configuration
      const smsStatus = await SmsService.getSmsStatus();
      const hasPermissionsAndActive = smsStatus.hasPermissions && smsStatus.isListenerActive;
      const status = hasPermissionsAndActive && configuration.smsListenerEnabled;
      setSmsListenerActive(status);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, []);

  // Initialize SMS listener
  const initSmsListener = useCallback(async () => {
    try {
      console.log('Initializing SMS listener...');
      
      // Request permissions directly
      const hasPermission = await requestAllPermissions();
      console.log('Permissions granted:', hasPermission);
      
      if (!hasPermission) {
        console.log('SMS permissions not granted');
        setSmsListenerActive(false);
        return false;
      }

      // Start SMS retriever
      const started = await SmsService.startSmsRetriever(async (record) => {
        console.log('OTP received in hook:', record);
        
        // Check if this OTP was already processed in background
        if (record.forwarded) {
          console.log('OTP already processed in background, just updating UI');
          setOtpRecords(prevRecords => [record, ...prevRecords]);
          return;
        }
        
        // Add new record to state
        setOtpRecords(prevRecords => [record, ...prevRecords]);
        
        // Forward OTP if configuration is available and not already forwarded
        if (config && !record.forwarded) {
          await forwardOTP(record, config);
          // Refresh data to show updated forwarding status
          loadData();
        }
      });
      
      console.log('SMS retriever started:', started);
      setSmsListenerActive(started);
      
      // Save SMS listener state to configuration
      if (config && started) {
        const updatedConfig = { ...config, smsListenerEnabled: true };
        await saveConfiguration(updatedConfig);
        setConfig(updatedConfig);
      }
      
      return started;
    } catch (error) {
      console.error('Error initializing SMS listener:', error);
      setSmsListenerActive(false);
      return false;
    }
  }, [config, loadData]);

  // Stop SMS listener
  const stopSmsListener = useCallback(async () => {
    try {
      console.log('Stopping SMS listener...');
      
      // Stop SMS retriever
      SmsService.stopSmsRetriever();
      
      // Update state immediately
      setSmsListenerActive(false);
      
      // Save SMS listener state to configuration
      if (config) {
        const updatedConfig = { ...config, smsListenerEnabled: false };
        await saveConfiguration(updatedConfig);
        setConfig(updatedConfig);
      }
      
      console.log('SMS listener stopped');
      return true;
    } catch (error) {
      console.error('Error stopping SMS listener:', error);
      return false;
    }
  }, [config]);

  // Check SMS listener status on mount
  const checkSmsListenerStatus = useCallback(async () => {
    const smsStatus = await SmsService.getSmsStatus();
    const hasPermissionsAndActive = smsStatus.hasPermissions && smsStatus.isListenerActive;
    
    // Also check the configuration state
    const configuration = await loadConfiguration();
    const status = hasPermissionsAndActive && configuration.smsListenerEnabled;
    
    console.log('SMS listener status check result:', status);
    console.log('Permissions and active:', hasPermissionsAndActive);
    console.log('Config enabled:', configuration.smsListenerEnabled);
    setSmsListenerActive(status);
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadData();
    checkSmsListenerStatus();
  }, [loadData, checkSmsListenerStatus]);

  return {
    otpRecords,
    config,
    loading,
    smsListenerActive,
    loadData,
    initSmsListener,
    stopSmsListener,
  };
};