import { create } from 'zustand';

// Shared, app-wide state: who's logged in.
// Read by AppNavigator (to pick Auth vs Main tabs), ProfileScreen,
// HomeScreen, etc. — all pointing at the same instance, so a logout
// anywhere instantly updates everywhere.
export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
