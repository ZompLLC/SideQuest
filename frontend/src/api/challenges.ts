import { Challenge } from "../types";
import { listGroups } from "./groups";

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

// There's no single "all challenges" endpoint on the backend -- quests are
// scoped to a group -- so this fetches the user's real groups first, then
// the challenges in each of them.
export async function getChallenges(token: string): Promise<Challenge[]> {
  const groups = await listGroups(token);
  const perGroupChallenges = await Promise.all(
    groups.map((group) => getChallengesByGroup(group.id)),
  );
  return perGroupChallenges.flat();
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

// GET /groups/:groupId/quests only returns partial records (id, creatorId,
// title, pointValue -- see ListQuestsResponseModel on the backend), so the
// fields it doesn't carry (status, description, dueAt, opponent) are filled
// in with placeholders here rather than fetched per-quest.
export async function getChallengesByGroup(
  groupId: string,
): Promise<Challenge[]> {
  const res = await fetch(`http://${SERVER_URL}/groups/${groupId}/quests`);
  const quests: Array<{
    id: string;
    creatorId: string;
    title: string;
    pointValue: number;
  }> = await res.json();
  if (!res.ok)
    throw new Error("Failed to load challenges for group " + groupId);

  return quests.map((q) => ({
    id: q.id,
    title: q.title,
    challenger: q.creatorId,
    opponent: "",
    pointValue: q.pointValue,
    status: "pending",
    groupId,
    description: "",
    dueAt: new Date(),
  }));
}
