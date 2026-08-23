import { Challenge } from "../types";

// Dummy data standing in for what apps/backend will eventually return.
// Function signatures/types here are the "contract" — hooks/screens
// won't need to change when this gets swapped for real fetch() calls.

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: "1",
    title: "5K Run",
    challenger: "Alex",
    opponent: "You",
    points: 20,
    status: "active",
    groupId: "g1",
  },
  {
    id: "2",
    title: "30-Day Pushup Streak",
    challenger: "Jordan",
    opponent: "You",
    points: 50,
    status: "pending",
    groupId: "g1",
  },
  {
    id: "3",
    title: "No Sugar Week",
    challenger: "You",
    opponent: "Sam",
    points: 15,
    status: "completed",
    groupId: "g2",
  },
  {
    id: "4",
    title: "Dish Duty Streak",
    challenger: "You",
    opponent: "Jordan",
    points: 10,
    status: "active",
    groupId: "g1",
  },
  {
    id: "5",
    title: "10K Steps Daily",
    challenger: "Sam",
    opponent: "You",
    points: 30,
    status: "active",
    groupId: "g2",
  },
  {
    id: "6",
    title: "No Netflix Week",
    challenger: "Casey",
    opponent: "You",
    points: 25,
    status: "pending",
    groupId: "g3",
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
  newChallenge: Omit<Challenge, "id" | "status">,
): Promise<Challenge> {
  await fakeDelay();
  const challenge: Challenge = {
    id: Date.now().toString(),
    status: "pending",
    ...newChallenge,
  };
  MOCK_CHALLENGES.push(challenge);
  return challenge;
  // Later: return fetch(`${API_URL}/challenges`, {
  //   method: 'POST',
  //   body: JSON.stringify(newChallenge),
  // }).then((r) => r.json());
}

export async function getChallengesByGroup(
  groupId: string,
): Promise<Challenge[]> {
  await fakeDelay();
  return MOCK_CHALLENGES.filter((c) => c.groupId === groupId);
  // Later: return fetch(`${API_URL}/groups/${groupId}/challenges`).then((r) => r.json());
}
