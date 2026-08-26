import { User } from "../types";
import { getUser } from "./user";

const SERVER_URL = `${process.env.EXPO_PUBLIC_BACKEND_HOST}:${process.env.EXPO_PUBLIC_BACKEND_PORT}`;

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; authToken: string }> {
  const res = await fetch(`http://${SERVER_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Login failed");

  const user = await getUser(data.userId);
  return { user, authToken: data.accessToken };
}

export async function signup(
  username: string,
  email: string,
  password: string,
): Promise<{ user: User; authToken: string }> {
  console.log(`Sending request for user registration: ${username}`);
  const res = await fetch(`http://${SERVER_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  else {
    const { username, email, id, authToken } = data;
    const user = { username, email, id };
    console.log(`Registered user: ${username}`);
    return { user, authToken };
  }
}

export async function logout(token: string): Promise<boolean> {
  console.log("Sending logout request.");
  const res = await fetch(`http://${SERVER_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.ok) {
    console.log("Logged out.");
    return true;
  } else {
    const data = await res.json();
    throw new Error(data.error.message);
  }
}
