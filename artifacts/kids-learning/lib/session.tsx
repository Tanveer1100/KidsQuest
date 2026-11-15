import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthTokenGetter, useListChildren, getListChildrenQueryKey } from '@workspace/api-client-react';

type SessionState = { tokenReady: boolean };
const SessionContext = createContext<SessionState>({ tokenReady: false });

/** Wires Clerk bearer tokens into the shared API client and clears caches on account changes. */
export function SessionBridge({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [tokenReady, setTokenReady] = useState(false);
  const prevUser = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setAuthTokenGetter(() => getTokenRef.current());
    setTokenReady(true);
    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    const id = userId ?? null;
    if (prevUser.current !== undefined && prevUser.current !== id) {
      queryClient.clear();
    }
    prevUser.current = id;
  }, [userId, queryClient]);

  return <SessionContext.Provider value={{ tokenReady }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export function childrenKey(userId: string | null | undefined) {
  return [...getListChildrenQueryKey(), userId ?? 'anonymous'] as const;
}

/** Child profiles for the signed-in parent, keyed by parent identity. */
export function useMyChildren() {
  const { isSignedIn, userId } = useAuth();
  const { tokenReady } = useSession();
  return useListChildren({
    query: {
      queryKey: childrenKey(userId),
      enabled: !!isSignedIn && !!userId && tokenReady,
    },
  });
}
