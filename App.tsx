import { useEffect } from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { registerForPushNotificationsAsync } from './src/services/notificationService';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) registerForPushNotificationsAsync(user.id);
  }, [user]);
  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}