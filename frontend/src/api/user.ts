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
