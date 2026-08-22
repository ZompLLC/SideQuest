const MOCK_USER = { id: 'u3', name: 'You', email: 'you@example.com' };

function fakeDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email, password) {
  await fakeDelay();
  if (email && password) return MOCK_USER;
  throw new Error('Invalid credentials');
  // Later: return fetch(`${API_URL}/auth/login`, {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password }),
  // }).then((r) => r.json());
}

export async function signup(name, email, password) {
  await fakeDelay();
  if (name && email && password) return { ...MOCK_USER, name, email };
  throw new Error('Missing signup fields');
}

export async function logout() {
  await fakeDelay(150);
  return true;
}
