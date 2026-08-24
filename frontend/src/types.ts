// Shared shapes used across api/, hooks/, store/, and screens/.
// Keeping these in one file means every layer agrees on what a
// "Challenge" or "User" looks like.

export type ChallengeStatus = "active" | "pending" | "completed";

export interface Challenge {
  id: string;
  title: string;
  challenger: string;
  opponent: string;
  points: number;
  status: ChallengeStatus;
  groupId: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  seasonLength: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
}

// --- Navigation param lists ---
// Typing these means navigation.navigate('X', params) and
// route.params are both type-checked and autocompleted.

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type ChallengesStackParamList = {
  ChallengesList: undefined;
  ChallengeDetail: { id: string };
  CreateChallenge: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Profile: undefined;
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { id: string; openChallengeId?: string };
  ChallengeDetail: { id: string };
};
