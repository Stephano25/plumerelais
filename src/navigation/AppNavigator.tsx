import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();

  if (!user) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
      <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
      <Stack.Screen name="Propose" component={ProposeScreen} />
      <Stack.Screen name="Vote" component={VoteScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="FinishedStory" component={FinishedStoryScreen} />
    </Stack.Navigator>
  );
}