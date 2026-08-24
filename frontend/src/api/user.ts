import { User } from "../types";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export async function getUser(userId: string): Promise<User> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}`);

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to fetch user");

  const { id, username, email } = data;
  return { id, username, email };
}

export async function updateUser(userId: string, username: string): Promise<User> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to update user");

  const { id, username: updatedUsername, email } = data;
  return { id, username: updatedUsername, email };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  token: string,
): Promise<void> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message ?? "Failed to change password");
  }
}

export async function changeEmail(
  userId: string,
  currentPassword: string,
  newEmail: string,
  token: string,
): Promise<User> {
  const res = await fetch(`http://${SERVER_URL}/users/${userId}/email`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newEmail }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to change email");

  const { id, username, email } = data;
  return { id, username, email };
}
