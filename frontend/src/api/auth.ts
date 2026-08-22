import { User } from '../types';

const MOCK_USER: User = { id: 'u3', name: 'You', email: 'you@example.com' };

function fakeDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email: string, password: string): Promise<User> {
  await fakeDelay();
  if (email && password) return MOCK_USER;
  throw new Error('Invalid credentials');
  // Later: return fetch(`${API_URL}/auth/login`, {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password }),
  // }).then((r) => r.json());
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  await fakeDelay();
  if (name && email && password) return { ...MOCK_USER, name, email };
  throw new Error('Missing signup fields');
}

export async function logout(): Promise<boolean> {
  await fakeDelay(150);
  return true;
}
