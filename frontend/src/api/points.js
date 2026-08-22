const MOCK_LEADERBOARD = [
  { userId: 'u1', name: 'Alex', points: 340 },
  { userId: 'u2', name: 'Jordan', points: 280 },
  { userId: 'u3', name: 'You', points: 190 },
  { userId: 'u4', name: 'Sam', points: 150 },
];

function fakeDelay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLeaderboard() {
  await fakeDelay();
  return MOCK_LEADERBOARD;
  // Later: return fetch(`${API_URL}/leaderboard`).then((r) => r.json());
}

export async function getMyPoints() {
  await fakeDelay(200);
  return MOCK_LEADERBOARD.find((u) => u.userId === 'u3');
}
