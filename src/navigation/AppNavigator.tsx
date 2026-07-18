import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../types/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
          <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
          <Stack.Screen name="Propose" component={ProposeScreen} />
          <Stack.Screen name="Vote" component={VoteScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="FinishedStory" component={FinishedStoryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}