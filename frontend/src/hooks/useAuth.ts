import { useState } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
} from "../api/auth";
import { useAuthStore } from "../store/authStore";

interface UseAuthResult {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Wraps the auth API calls with per-screen loading/error state,
// then writes the result into the shared authStore so the rest
// of the app (navigation, profile, etc.) can react to it.
export function useAuth(): UseAuthResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const user = await apiLogin(email, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function signup(username: string, email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const user = await apiSignup(username, email, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await apiLogout();
    clearUser();
  }

  return { login, signup, logout, loading, error };
}
