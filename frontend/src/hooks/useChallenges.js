import { useState, useEffect, useCallback } from 'react';
import { getChallenges } from '../api/challenges';

export function useChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
