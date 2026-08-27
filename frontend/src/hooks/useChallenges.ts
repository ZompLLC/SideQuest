import { useState, useEffect, useCallback } from "react";
import { getChallenges } from "../api/challenges";
import { useTokenStore } from "../store/tokenStore";
import { Challenge } from "../types";

interface UseChallengesResult {
  challenges: Challenge[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useChallenges(): UseChallengesResult {
  const token = useTokenStore((s) => s.token);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChallenges([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    let ignore = false;
    // Resets the loading flag for each new fetch (initial mount and refetch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getChallenges(token)
      .then((data) => {
        if (!ignore) setChallenges(data);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [token, refetchIndex]);

  const refetch = useCallback(() => {
    setRefetchIndex((i) => i + 1);
  }, []);

  return { challenges, loading, error, refetch };
}
