/**
 * OTP Link App
 * A React Native app for receiving and forwarding OTPs
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  // Define Material Design 3 themes
  const lightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#6750A4',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EADDFF',
      onPrimaryContainer: '#21005D',
      secondary: '#625B71',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#E8DEF8',
      onSecondaryContainer: '#1D192B',
      tertiary: '#7D5260',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#FFD8E4',
      onTertiaryContainer: '#31111D',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      errorContainer: '#FFDAD6',
      onErrorContainer: '#410002',
      background: '#FFFBFE',
      onBackground: '#1C1B1F',
      surface: '#FFFBFE',
      onSurface: '#1C1B1F',
      surfaceVariant: '#E7E0EC',
      onSurfaceVariant: '#49454F',
      outline: '#79747E',
      outlineVariant: '#CAC4D0',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#313033',
      inverseOnSurface: '#F4EFF4',
      inversePrimary: '#D0BCFF',
    },
  };

  const darkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#D0BCFF',
      onPrimary: '#381E72',
      primaryContainer: '#4F378B',
      onPrimaryContainer: '#EADDFF',
      secondary: '#CCC2DC',
      onSecondary: '#332D41',
      secondaryContainer: '#4A4458',
      onSecondaryContainer: '#E8DEF8',
      tertiary: '#EFB8C8',
      onTertiary: '#492532',
      tertiaryContainer: '#633B48',
      onTertiaryContainer: '#FFD8E4',
      error: '#FFB4AB',
      onError: '#690005',
      errorContainer: '#93000A',
      onErrorContainer: '#FFDAD6',
      background: '#1C1B1F',
      onBackground: '#E6E1E5',
      surface: '#1C1B1F',
      onSurface: '#E6E1E5',
      surfaceVariant: '#49454F',
      onSurfaceVariant: '#CAC4D0',
      outline: '#938F99',
      outlineVariant: '#49454F',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#E6E1E5',
      inverseOnSurface: '#313033',
      inversePrimary: '#6750A4',
    },
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;