import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

// AppNavigator (src/navigation/AppNavigator.tsx) is the single source of
// truth for what's on screen: it reads authStore and renders either
// AuthNavigator (Login/Signup) or MainTabNavigator (Home/Challenges/
// Leaderboard/Profile), each of which wires up the actual screen
// components in src/screens/.
export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
