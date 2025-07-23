import { useState, useEffect, useCallback } from 'react';
import { OTPRecord, Configuration } from '../types';
import { loadOTPRecords, loadConfiguration } from '../services/storageService';
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
        
        // Add new record to state
        setOtpRecords(prevRecords => [record, ...prevRecords]);
        
        // Forward OTP if configuration is available
        if (config) {
          await forwardOTP(record, config);
          // Refresh data to show updated forwarding status
          loadData();
        }
      });
      
      console.log('SMS retriever started:', started);
      setSmsListenerActive(started);
      return started;
    } catch (error) {
      console.error('Error initializing SMS listener:', error);
      setSmsListenerActive(false);
      return false;
    }
  }, [config, loadData]);

  // Check SMS listener status on mount
  const checkSmsListenerStatus = useCallback(async () => {
    const smsStatus = await SmsService.getSmsStatus();
    const status = smsStatus.hasPermissions && smsStatus.isListenerActive;
    
    console.log('SMS listener status check result:', status);
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
  };
};