import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Écrans d'auth
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Écrans principaux
import HomeScreen from '../screens/HomeScreen';
import CreateStoryScreen from '../screens/CreateStoryScreen';
import StoryDetailScreen from '../screens/StoryDetailScreen';
import ProposeScreen from '../screens/ProposeScreen';
import VoteScreen from '../screens/VoteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FinishedStoryScreen from '../screens/FinishedStoryScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Plume Relais' }} />
      <Stack.Screen name="CreateStory" component={CreateStoryScreen} options={{ title: 'Nouvelle histoire' }} />
      <Stack.Screen name="StoryDetail" component={StoryDetailScreen} options={{ title: 'Histoire' }} />
      <Stack.Screen name="Propose" component={ProposeScreen} options={{ title: 'Proposer une suite' }} />
      <Stack.Screen name="Vote" component={VoteScreen} options={{ title: 'Voter' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon profil' }} />
      <Stack.Screen name="FinishedStory" component={FinishedStoryScreen} options={{ title: 'Histoire complète' }} />
    </Stack.Navigator>
  );
}