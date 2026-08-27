import { User, UserStats } from "../types";

const SERVER_URL = `${process.env.EXPO_PUBLIC_BACKEND_HOST}:${process.env.EXPO_PUBLIC_BACKEND_PORT}`;

export async function getUser(userId: string): Promise<User> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}`);

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to fetch user");

  const { id, username, email } = data;
  return { id, username, email };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}/stats`);

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to fetch stats");
  return data;
}

export interface UpdateUserPayload {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  email?: string;
}

// Single combined endpoint -- any subset of username/newPassword/email
// can be set in one call; currentPassword is required whenever newPassword
// or email is present. Always requires auth now, including username-only
// changes (the backend used to allow that without a token).
export async function updateUser(
  userId: string,
  updates: UpdateUserPayload,
  token: string,
): Promise<User> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to update user");

  const { id, username, email } = data;
  return { id, username, email };
}
