import { User } from "../types";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export async function getUser(userId: string): Promise<User> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}`);

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to fetch user");

  const { id, username, email } = data;
  return { id, username, email };
}

export interface UpdateUserPayload {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
  newEmail?: string;
}

// Single combined endpoint -- any subset of username/newPassword/newEmail
// can be set in one call; currentPassword is required whenever newPassword
// or newEmail is present. Always requires auth now, including username-only
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
