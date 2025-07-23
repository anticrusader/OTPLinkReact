import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  Chip,
  TextInput,
  Title,
  Text,
  Snackbar,
  Card,
  IconButton,
} from 'react-native-paper';
import { loadConfiguration, saveConfiguration } from '../services/storageService';
import { getDefaultKeywords } from '../utils/otpUtils';
import { Configuration } from '../types';

const KeywordManagerScreen = () => {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configuration = await loadConfiguration();
        setConfig(configuration);
        setLoading(false);
      } catch (error) {
        console.error('Error loading configuration:', error);
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Add keyword
  const addKeyword = () => {
    if (!config || !newKeyword.trim()) return;

    const keyword = newKeyword.trim().toLowerCase();
    
    // Check if keyword already exists
    if (config.keywords.includes(keyword)) {
      setSnackbarMessage('Keyword already exists');
      setSnackbarVisible(true);
      return;
    }

    // Add keyword
    const updatedKeywords = [...config.keywords, keyword];
    setConfig({
      ...config,
      keywords: updatedKeywords,
    });
    setNewKeyword('');
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    if (!config) return;

    const updatedKeywords = config.keywords.filter((k) => k !== keyword);
    setConfig({
      ...config,
      keywords: updatedKeywords,
    });
  };

  // Reset to default keywords
  const resetToDefault = () => {
    if (!config) return;

    setConfig({
      ...config,
      keywords: getDefaultKeywords(),
    });
    setSnackbarMessage('Reset to default keywords');
    setSnackbarVisible(true);
  };

  // Save keywords
  const saveKeywords = async () => {
    if (!config) return;

    try {
      await saveConfiguration(config);
      setSnackbarMessage('Keywords saved successfully');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error saving keywords:', error);
      setSnackbarMessage('Failed to save keywords');
      setSnackbarVisible(true);
    }
  };

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading keywords...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Manage Keywords</Title>
            <Text style={styles.description}>
              OTP Link will only process messages containing these keywords.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                label="New Keyword"
                value={newKeyword}
                onChangeText={setNewKeyword}
                style={styles.input}
              />
              <IconButton
                icon="plus"
                size={24}
                onPress={addKeyword}
                disabled={!newKeyword.trim()}
                style={styles.addButton}
              />
            </View>

            <View style={styles.keywordsContainer}>
              {config.keywords.length === 0 ? (
                <Text style={styles.emptyText}>No keywords added</Text>
              ) : (
                config.keywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    onClose={() => removeKeyword(keyword)}
                    style={styles.chip}
                    textStyle={styles.chipText}
                  >
                    {keyword}
                  </Chip>
                ))
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={resetToDefault}
          style={[styles.button, styles.resetButton]}
        >
          Reset to Default
        </Button>
        <Button
          mode="contained"
          onPress={saveKeywords}
          style={[styles.button, styles.saveButton]}
        >
          Save Keywords
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#757575',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addButton: {
    margin: 0,
    backgroundColor: '#e0e0e0',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  chipText: {
    fontSize: 14,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#757575',
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
  },
  resetButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
    backgroundColor: '#6200ee',
  },
});

export default KeywordManagerScreen;