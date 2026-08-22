import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import ChallengesScreen from '../screens/challenges/ChallengesScreen';
import ChallengeDetailScreen from '../screens/challenges/ChallengeDetailScreen';
import CreateChallengeScreen from '../screens/challenges/CreateChallengeScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../theme';
import { MainTabParamList, ChallengesStackParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChallengesStack = createNativeStackNavigator<ChallengesStackParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Challenges: 'flame',
  Leaderboard: 'trophy',
  Profile: 'person',
};

// Challenges gets its own stack so list -> detail -> create can push/pop
// while still living under a single "Challenges" tab.
function ChallengesStackNavigator() {
  return (
    <ChallengesStack.Navigator
      screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTitleStyle: { color: colors.text } }}
    >
      <ChallengesStack.Screen name="ChallengesList" component={ChallengesScreen} options={{ title: 'Challenges' }} />
      <ChallengesStack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ title: 'Challenge' }} />
      <ChallengesStack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{ title: 'New Challenge' }} />
    </ChallengesStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Challenges" component={ChallengesStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
