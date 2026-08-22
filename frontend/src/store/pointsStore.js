import { create } from 'zustand';

// Shared running point total — shown in a Home header badge
// AND on the Profile screen. Kept as one source of truth instead
// of two screens independently fetching and potentially drifting.
export const usePointsStore = create((set) => ({
  totalPoints: 0,
  setTotalPoints: (points) => set({ totalPoints: points }),
  addPoints: (amount) =>
    set((state) => ({ totalPoints: state.totalPoints + amount })),
}));
