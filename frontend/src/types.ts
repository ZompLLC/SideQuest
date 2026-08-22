// Shared shapes used across api/, hooks/, store/, and screens/.
// Keeping these in one file means every layer agrees on what a
// "Challenge" or "User" looks like.

export type ChallengeStatus = 'active' | 'pending' | 'completed';

export interface Challenge {
  id: string;
  title: string;
  challenger: string;
  opponent: string;
  points: number;
  status: ChallengeStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
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
  Challenges: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};
