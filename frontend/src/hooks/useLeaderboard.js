import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/points';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  return { leaderboard, loading };
}
