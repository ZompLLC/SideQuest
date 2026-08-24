import { useState, useEffect } from "react";
import { getUserStats } from "../api/user";
import { UserStats } from "../types";

interface UseUserStatsResult {
  stats: UserStats | null;
  loading: boolean;
}

export function useUserStats(userId: string | undefined): UseUserStatsResult {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getUserStats(userId)
      .then((data) => {
        if (!ignore) setStats(data);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  return { stats, loading };
}
