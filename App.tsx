import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoriesProvider } from './src/contexts/StoriesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notificationService';
import { useAuth } from './src/contexts/AuthContext';
import { isWeb } from './src/utils/platform';

function AppContent() {
  const { user } = useAuth();
  useEffect(() => {
    if (!isWeb && user) {
      registerForPushNotificationsAsync(user.id);
    }
  }, [user]);
  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <StoriesProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </StoriesProvider>
    </AuthProvider>
  );
}