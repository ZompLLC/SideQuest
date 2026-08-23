import { useState, useEffect, useCallback } from 'react';
import { getChallenges } from '../api/challenges';
import { Challenge } from '../types';

interface UseChallengesResult {
  challenges: Challenge[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useChallenges(): UseChallengesResult {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    let ignore = false;
    // Resets the loading flag for each new fetch (initial mount and refetch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getChallenges()
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
  }, [refetchIndex]);

  const refetch = useCallback(() => {
    setRefetchIndex((i) => i + 1);
  }, []);

  return { challenges, loading, error, refetch };
}
