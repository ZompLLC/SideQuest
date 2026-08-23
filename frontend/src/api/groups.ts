import { Group } from "../types";

// Dummy data standing in for what apps/backend will eventually return.
// Function signatures/types here are the "contract" — hooks/screens
// won't need to change when this gets swapped for real fetch() calls.

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

export async function getGroups(): Promise<Group[]> {
  await fakeDelay();
  return MOCK_GROUPS;
  // Later: return fetch(`${API_URL}/groups`).then((r) => r.json());
}

export async function getGroupById(id: string): Promise<Group> {
  await fakeDelay(300);
  const group = MOCK_GROUPS.find((g) => g.id === id);
  if (!group) throw new Error("Group not found");
  return group;
}

export async function createGroup(
  newGroup: Omit<Group, "id" | "inviteCode" | "memberCount">,
): Promise<Group> {
  await fakeDelay();
  const group: Group = {
    id: Date.now().toString(),
    inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    memberCount: 1,
    ...newGroup,
  };
  MOCK_GROUPS.push(group);
  return group;
  // Later: return fetch(`${API_URL}/groups`, {
  //   method: 'POST',
  //   body: JSON.stringify(newGroup),
  // }).then((r) => r.json());
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
