import { Challenge } from "../types";

// Dummy data standing in for what apps/backend will eventually return.
// Function signatures/types here are the "contract" — hooks/screens
// won't need to change when this gets swapped for real fetch() calls.
// MOVE SERVER INTO ONE PLACE
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "1",
    title: "5K Run",
    challenger: "Alex",
    opponent: "You",
    pointValue: 20,
    status: "active",
    groupId: "g1",
    description: "Complete a 5K run before the deadline. Fastest time wins.",
    dueAt: new Date("2026-08-31"),
  },
  {
    id: "2",
    title: "30-Day Pushup Streak",
    challenger: "Jordan",
    opponent: "You",
    pointValue: 50,
    status: "pending",
    groupId: "g1",
    description: "Do at least one pushup every day for 30 days straight.",
    dueAt: new Date("2026-09-23"),
  },
  {
    id: "3",
    title: "No Sugar Week",
    challenger: "You",
    opponent: "Sam",
    pointValue: 15,
    status: "completed",
    groupId: "g2",
    description: "Avoid added sugar for a full week. Honor system.",
    dueAt: new Date("2026-08-17"),
  },
  {
    id: "4",
    title: "Dish Duty Streak",
    challenger: "You",
    opponent: "Jordan",
    pointValue: 10,
    status: "active",
    groupId: "g1",
    description: "Whoever skips dish duty first loses.",
    dueAt: new Date("2026-08-30"),
  },
  {
    id: "5",
    title: "10K Steps Daily",
    challenger: "Sam",
    opponent: "You",
    pointValue: 30,
    status: "active",
    groupId: "g2",
    description: "Hit 10,000 steps every day this month.",
    dueAt: new Date("2026-09-01"),
  },
  {
    id: "6",
    title: "No Netflix Week",
    challenger: "Casey",
    opponent: "You",
    pointValue: 25,
    status: "pending",
    groupId: "g3",
    description: "No streaming Netflix for 7 days. First to cave loses.",
    dueAt: new Date("2026-08-28"),
  },
];

function fakeDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getChallenges(): Promise<Challenge[]> {
  await fakeDelay();
  return MOCK_CHALLENGES;
  // Later: return fetch(`${API_URL}/challenges`).then((r) => r.json());
}

export async function getChallengeById(id: string): Promise<Challenge> {
  await fakeDelay(300);
  const challenge = MOCK_CHALLENGES.find((c) => c.id === id);
  if (!challenge) throw new Error("Challenge not found");
  return challenge;
}

export async function createChallenge(
  newChallenge: Pick<
    Challenge,
    "title" | "description" | "pointValue" | "dueAt"
  >,
  groupId: string,
  token: string,
): Promise<Omit<Challenge, "status" | "completedAt">> {
  console.log(groupId, token, newChallenge);
  const res = await fetch(`http://${SERVER_URL}/groups/${groupId}/quests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newChallenge),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error?.message ?? "Failed to create challenge");
  return data;

  /*
  await fakeDelay();
  const challenge: Challenge = {
    id: Date.now().toString(),
    status: "pending",
    ...newChallenge,
  };
  MOCK_CHALLENGES.push(challenge);
  return challenge;
  */
}

export async function getChallengesByGroup(
  groupId: string,
): Promise<Challenge[]> {
  await fakeDelay();
  return MOCK_CHALLENGES.filter((c) => c.groupId === groupId);
  // Later: return fetch(`${API_URL}/groups/${groupId}/challenges`).then((r) => r.json());
}
