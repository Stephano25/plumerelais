// App.tsx
import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoriesProvider } from './src/contexts/StoriesContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StoriesProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </StoriesProvider>
    </AuthProvider>
  );
}