import { User } from "../types";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const MOCK_USER: User = { id: "u3", username: "You", email: "you@example.com" };

function fakeDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email: string, password: string): Promise<User> {
  await fakeDelay();
  if (email && password) return MOCK_USER;
  throw new Error("Invalid credentials");
  // Later: return fetch(`${API_URL}/auth/login`, {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password }),
  // }).then((r) => r.json());
}

export async function signup(
  username: string,
  email: string,
  password: string,
): Promise<User> {
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
    const { username, email, id } = data;
    console.log(`Registered user: ${username}`);
    return { username, email, id };
  }
}

export async function logout(): Promise<boolean> {
  await fakeDelay(150);
  return true;
}
