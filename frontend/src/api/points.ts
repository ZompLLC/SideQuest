import { LeaderboardEntry } from "../types";

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { userId: "u1", username: "Alex", points: 340 },
  { userId: "u2", username: "Jordan", points: 280 },
  { userId: "u3", username: "You", points: 190 },
  { userId: "u4", username: "Sam", points: 150 },
];

function fakeDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  await fakeDelay();
  return MOCK_LEADERBOARD;
  // Later: return fetch(`${API_URL}/leaderboard`).then((r) => r.json());
}

export async function getMyPoints(): Promise<LeaderboardEntry | undefined> {
  await fakeDelay(200);
  return MOCK_LEADERBOARD.find((u) => u.userId === "u3");
}
