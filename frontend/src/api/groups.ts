import { Group } from "../types";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

// Dummy data standing in for what apps/backend will eventually return.
// Function signatures/types here are the "contract" — hooks/screens
// won't need to change when this gets swapped for real fetch() calls.
// Still backs getGroups()/getGroupById()'s fallback -- Home renders its
// grouped view from these mock groups/challenges, so this stays intact.

const MOCK_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Roommates",
    ownerId: "u1",
    inviteCode: "ROOM-4F2K",
    memberCount: 3,
    seasonLength: 30,
  },
  {
    id: "g2",
    name: "Gym Squad",
    ownerId: "u2",
    inviteCode: "GYM-9XQ1",
    memberCount: 2,
    seasonLength: 14,
  },
  {
    id: "g3",
    name: "College Friends",
    ownerId: "u1",
    inviteCode: "COLL-7B3P",
    memberCount: 4,
    seasonLength: 60,
  },
];

function fakeDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Used by HomeScreen -- kept mocked so its grouped-challenges view is
// unaffected by the Groups tab's switch to the real backend.
export async function getGroups(): Promise<Group[]> {
  await fakeDelay();
  return MOCK_GROUPS;
}

// Real backend list, used by the Groups tab. Separate from getGroups()
// above so HomeScreen's mock-backed behavior doesn't change.
export async function listGroups(token: string): Promise<Group[]> {
  const res = await fetch(`http://${SERVER_URL}/groups`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to load groups");
  return data;
}

// Tries the real backend first (for groups created via the Groups tab),
// falling back to the mock lookup for the ids getGroups() above hands out
// (e.g. from HomeScreen's group sections) that the backend doesn't know.
export async function getGroupById(id: string): Promise<Group> {
  try {
    const res = await fetch(`http://${SERVER_URL}/groups/${id}`);
    if (res.ok) return await res.json();
  } catch {
    // network error -- fall through to the mock lookup below
  }

  await fakeDelay(300);
  const group = MOCK_GROUPS.find((g) => g.id === id);
  if (!group) throw new Error("Group not found");
  return group;
}

export async function createGroup(name: string, token: string): Promise<Group> {
  const res = await fetch(`http://${SERVER_URL}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to create group");
  return data;
}

export async function joinGroupByInviteCode(
  inviteCode: string,
): Promise<Group> {
  await fakeDelay(300);
  const group = MOCK_GROUPS.find((g) => g.inviteCode === inviteCode);
  if (!group) throw new Error("Invalid invite code");
  group.memberCount += 1;
  return group;
  // Later: return fetch(`${API_URL}/groups/join`, {
  //   method: 'POST',
  //   body: JSON.stringify({ inviteCode }),
  // }).then((r) => r.json());
}
