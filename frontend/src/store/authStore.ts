import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

// Shared, app-wide state: who's logged in.
// Read by AppNavigator (to pick Auth vs Main tabs), ProfileScreen,
// HomeScreen, etc. — all pointing at the same instance, so a logout
// anywhere instantly updates everywhere.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
