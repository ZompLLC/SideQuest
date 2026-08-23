import { create } from "zustand";

interface TokenState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

// Stores the token used to authenticate requests.
export const useTokenStore = create<TokenState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null }),
}));
