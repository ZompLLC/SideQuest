import { useState } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
} from "../api/auth";
import {
  updateUser as apiUpdateUser,
  changePassword as apiChangePassword,
  changeEmail as apiChangeEmail,
} from "../api/user";
import { useAuthStore } from "../store/authStore";
import { useTokenStore } from "@/store/tokenStore";

interface UseAuthResult {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  changingPassword: boolean;
  changePasswordError: string | null;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<boolean>;
  changingEmail: boolean;
  changeEmailError: string | null;
}

// Wraps the auth API calls with per-screen loading/error state,
// then writes the result into the shared authStore so the rest
// of the app (navigation, profile, etc.) can react to it.
export function useAuth(): UseAuthResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<
    string | null
  >(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(
    null,
  );
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const token = useTokenStore((s) => s.token);
  const setToken = useTokenStore((s) => s.setToken);
  const clearToken = useTokenStore((s) => s.clearToken);

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const { user, authToken } = await apiLogin(email, password);
      setUser(user);
      setToken(authToken);
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
      const { user, authToken } = await apiSignup(username, email, password);
      setUser(user);
      setToken(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await apiLogout(token ?? "");
    clearUser();
    clearToken();
  }

  async function updateUsername(username: string): Promise<boolean> {
    if (!user) return false;
    setLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateUser(user.id, username);
      setUser(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    if (!user || !token) return false;
    setChangingPassword(true);
    setChangePasswordError(null);
    try {
      await apiChangePassword(user.id, currentPassword, newPassword, token);
      return true;
    } catch (err) {
      setChangePasswordError(
        err instanceof Error ? err.message : "Failed to change password",
      );
      return false;
    } finally {
      setChangingPassword(false);
    }
  }

  async function changeEmail(
    currentPassword: string,
    newEmail: string,
  ): Promise<boolean> {
    if (!user || !token) return false;
    setChangingEmail(true);
    setChangeEmailError(null);
    try {
      const updated = await apiChangeEmail(
        user.id,
        currentPassword,
        newEmail,
        token,
      );
      setUser(updated);
      return true;
    } catch (err) {
      setChangeEmailError(
        err instanceof Error ? err.message : "Failed to change email",
      );
      return false;
    } finally {
      setChangingEmail(false);
    }
  }

  return {
    login,
    signup,
    logout,
    updateUsername,
    loading,
    error,
    changePassword,
    changingPassword,
    changePasswordError,
    changeEmail,
    changingEmail,
    changeEmailError,
  };
}
