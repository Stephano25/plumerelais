import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Écrans d’auth
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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Non connecté
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Connecté
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: true, title: 'Plume Relais' }} />
          <Stack.Screen name="CreateStory" component={CreateStoryScreen} options={{ headerShown: true, title: 'Nouvelle histoire' }} />
          <Stack.Screen name="StoryDetail" component={StoryDetailScreen} options={{ headerShown: true, title: 'Histoire' }} />
          <Stack.Screen name="Propose" component={ProposeScreen} options={{ headerShown: true, title: 'Proposer une suite' }} />
          <Stack.Screen name="Vote" component={VoteScreen} options={{ headerShown: true, title: 'Voter' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Mon profil' }} />
          <Stack.Screen name="FinishedStory" component={FinishedStoryScreen} options={{ headerShown: true, title: 'Histoire complète' }} />
        </>
      )}
    </Stack.Navigator>
  );
}