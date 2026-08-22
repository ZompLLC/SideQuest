import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Top-level switch: logged-out users see the Auth stack,
// logged-in users see the Main tabs. Reads directly from the
// shared authStore so it reacts instantly to login/logout.
export default function AppNavigator() {
  const user = useAuthStore((s) => s.user);

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
