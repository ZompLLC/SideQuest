import { useState } from 'react';
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from '../api/auth';
import { useAuthStore } from '../store/authStore';

// Wraps the auth API calls with per-screen loading/error state,
// then writes the result into the shared authStore so the rest
// of the app (navigation, profile, etc.) can react to it.
export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const user = await apiLogin(email, password);
      setUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function signup(name, email, password) {
    setLoading(true);
    setError(null);
    try {
      const user = await apiSignup(name, email, password);
      setUser(user);
    } catch (err) {
      setError(err.message);
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
