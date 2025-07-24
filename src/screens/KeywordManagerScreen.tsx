import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
      >
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
                mode="outlined"
              />
              <IconButton
                icon="plus"
                size={24}
                onPress={addKeyword}
                disabled={!newKeyword.trim()}
                style={styles.addButton}
                mode="contained"
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
                    mode="flat"
                  >
                    {keyword}
                  </Chip>
                ))
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Buttons moved inside ScrollView */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={resetToDefault}
            style={[styles.button, styles.resetButton]}
            icon="refresh"
            contentStyle={styles.buttonContent}
          >
            Reset to Default
          </Button>
          <Button
            mode="contained"
            onPress={saveKeywords}
            style={[styles.button, styles.saveButton]}
            icon="content-save"
            contentStyle={styles.buttonContent}
          >
            Save Keywords
          </Button>
        </View>
      </ScrollView>

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
    backgroundColor: '#FFFBFE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    margin: 16,
    elevation: 3,
    borderRadius: 12,
  },
  title: {
    marginBottom: 8,
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 16,
    color: '#757575',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
  },
  addButton: {
    margin: 0,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
    backgroundColor: '#E8DEF8',
  },
  chipText: {
    fontSize: 14,
    color: '#1D192B',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#757575',
    marginVertical: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 24,
  },
  resetButton: {
    borderColor: '#6750A4',
  },
  saveButton: {
    backgroundColor: '#6750A4',
  },
  buttonContent: {
    height: 40,
  },
});

export default KeywordManagerScreen;