// Dummy data standing in for what apps/backend will eventually return.
// Function signatures here are the "contract" — screens/hooks won't need to
// change when this gets swapped for real fetch() calls.

const MOCK_CHALLENGES = [
  {
    id: '1',
    title: '5K Run',
    challenger: 'Alex',
    opponent: 'You',
    points: 20,
    status: 'active',
  },
  {
    id: '2',
    title: '30-Day Pushup Streak',
    challenger: 'Jordan',
    opponent: 'You',
    points: 50,
    status: 'pending',
  },
  {
    id: '3',
    title: 'No Sugar Week',
    challenger: 'You',
    opponent: 'Sam',
    points: 15,
    status: 'completed',
  },
];

function fakeDelay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getChallenges() {
  await fakeDelay();
  return MOCK_CHALLENGES;
  // Later: return fetch(`${API_URL}/challenges`).then((r) => r.json());
}

export async function getChallengeById(id) {
  await fakeDelay(300);
  const challenge = MOCK_CHALLENGES.find((c) => c.id === id);
  if (!challenge) throw new Error('Challenge not found');
  return challenge;
}

export async function createChallenge(newChallenge) {
  await fakeDelay();
  const challenge = {
    id: Date.now().toString(),
    status: 'pending',
    ...newChallenge,
  };
  MOCK_CHALLENGES.push(challenge);
  return challenge;
  // Later: return fetch(`${API_URL}/challenges`, {
  //   method: 'POST',
  //   body: JSON.stringify(newChallenge),
  // }).then((r) => r.json());
}
