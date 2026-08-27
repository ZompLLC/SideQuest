import { useState, useEffect, useCallback } from "react";
import {
  getGroups,
  listGroups,
  createGroup as apiCreateGroup,
} from "../api/groups";
import { useTokenStore } from "../store/tokenStore";
import { Group } from "../types";

interface UseGroupsResult {
  groups: Group[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createGroup: (name: string) => Promise<void>;
  creating: boolean;
  createError: string | null;
}

// Backs the Groups tab specifically. Shows the same hardcoded mock groups
// HomeScreen renders (via getGroups()) alongside real groups from the
// backend (via listGroups()), so groups created here show up too.
export function useGroups(): UseGroupsResult {
  const token = useTokenStore((s) => s.token);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    // Mock groups always load, independent of auth/backend state, so a
    // missing token or an unreachable backend can't hide them. Real groups
    // are layered on top when available.
    getGroups()
      .then((mockGroups) => {
        if (ignore) return;
        setGroups(mockGroups);

        if (!token) {
          setLoading(false);
          return;
        }
        listGroups(token)
          .then((realGroups) => {
            if (!ignore) setGroups([...mockGroups, ...realGroups]);
          })
          .catch((err) => {
            if (!ignore) setError(err);
          })
          .finally(() => {
            if (!ignore) setLoading(false);
          });
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token, refetchIndex]);

  const refetch = useCallback(() => {
    setRefetchIndex((i) => i + 1);
  }, []);

  async function createGroup(name: string) {
    if (!token) return;
    setCreating(true);
    setCreateError(null);
    try {
      await apiCreateGroup(name, token);
      refetch();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create group",
      );
    } finally {
      setCreating(false);
    }
  }

  return {
    groups,
    loading,
    error,
    refetch,
    createGroup,
    creating,
    createError,
  };
}
