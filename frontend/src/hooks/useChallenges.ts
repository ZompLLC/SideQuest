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

  const refetch = useCallback(() => {
    setLoading(true);
    getChallenges()
      .then(setChallenges)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { challenges, loading, error, refetch };
}
