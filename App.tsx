// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoriesProvider } from './src/contexts/StoriesContext'; // ✅ Ajout
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StoriesProvider> {/* ✅ Wrap avec StoriesProvider */}
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </StoriesProvider>
    </AuthProvider>
  );
}