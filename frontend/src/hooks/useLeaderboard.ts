import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/points';
import { LeaderboardEntry } from '../types';

interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
}

export function useLeaderboard(): UseLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  return { leaderboard, loading };
}
