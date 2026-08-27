import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/home/HomeScreen";
import GroupsScreen from "../screens/groups/GroupsScreen";
import GroupDetailScreen from "../screens/groups/GroupDetailScreen";
import ChallengeDetailScreen from "../screens/challenges/ChallengeDetailScreen";
import CreateChallengeScreen from "../screens/challenges/CreateChallengeScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import { colors } from "../theme";
import {
  MainTabParamList,
  GroupsStackParamList,
  ProfileStackParamList,
} from "../types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Groups: "flame",
  Profile: "person",
};
// Groups gets its own stack so list -> detail -> challenge can push/pop
// while still living under a single "Groups" tab.
function GroupsStackNavigator() {
  return (
    <GroupsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
      }}
    >
      <GroupsStack.Screen
        name="GroupsList"
        component={GroupsScreen}
        options={{ title: "Groups" }}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: "Group" }}
      />
      <GroupsStack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ title: "Challenge" }}
      />
      <GroupsStack.Screen
        name="CreateChallenge"
        component={CreateChallengeScreen}
        options={{ title: "Create" }}
      />
    </GroupsStack.Navigator>
  );
}

// Profile gets its own stack so Edit Profile pushes as a separate page
// while still living under a single "Profile" tab.
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
      />
    </ProfileStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={ICONS[route.name as keyof MainTabParamList]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Groups"
        component={GroupsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
