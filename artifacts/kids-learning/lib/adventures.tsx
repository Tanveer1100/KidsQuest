import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdventureQueryKey,
  getListAdventuresQueryKey,
  useGetAdventure,
  useListAdventures,
  type Adventure,
  type Subject,
} from '@workspace/api-client-react';
import { useSession } from '@/lib/session';

export const SUBJECT_META: { slug: Subject; title: string; icon: 'calculator-variant' | 'book-open-page-variant' | 'flask-outline' | 'translate' }[] = [
  { slug: 'math', title: 'Math', icon: 'calculator-variant' },
  { slug: 'english-reading', title: 'English reading', icon: 'book-open-page-variant' },
  { slug: 'science', title: 'Science', icon: 'flask-outline' },
  { slug: 'second-language', title: 'Second language', icon: 'translate' },
];

export function subjectMeta(slug: string | undefined) {
  return SUBJECT_META.find((s) => s.slug === slug);
}

export function adventuresKey(childId: number, userId: string | null | undefined) {
  return [...getListAdventuresQueryKey({ childId }), userId ?? 'anonymous'] as const;
}
export function adventureKey(id: number, userId: string | null | undefined) {
  return [...getGetAdventureQueryKey(id), userId ?? 'anonymous'] as const;
}

export function useChildAdventures(childId: number) {
  const { userId } = useAuth();
  const { tokenReady } = useSession();
  return useListAdventures({ childId }, {
    query: { queryKey: adventuresKey(childId, userId), enabled: tokenReady && !!userId && childId > 0 },
  });
}

export function useAdventure(id: number) {
  const { userId } = useAuth();
  const { tokenReady } = useSession();
  return useGetAdventure(id, {
    query: { queryKey: adventureKey(id, userId), enabled: tokenReady && !!userId && id > 0 },
  });
}

/** Writes a fresh adventure into its detail cache and invalidates every adventure list. */
export function useAdventureCacheSync() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return (a: Adventure) => {
    qc.setQueryData(adventureKey(a.id, userId), a);
    qc.invalidateQueries({ queryKey: getListAdventuresQueryKey() });
  };
}

export function errorText(err: unknown, fallback: string): string {
  const data = (err as { data?: unknown } | null)?.data;
  if (data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  return fallback;
}

export function newRequestId() {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
