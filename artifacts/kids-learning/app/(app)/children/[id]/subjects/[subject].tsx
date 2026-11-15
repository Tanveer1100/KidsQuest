import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStartAdventure } from '@workspace/api-client-react';
import { Button, Notice, Screen, TopBar } from '@/components/ui';
import { StatusBadge } from '@/components/AdventurePlan';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { errorText, subjectMeta, useAdventureCacheSync, useChildAdventures } from '@/lib/adventures';

type Tab = 'active' | 'completed';

export default function SubjectScreen() {
  const c = useColors();
  const router = useRouter();
  const { id, subject } = useLocalSearchParams<{ id: string; subject: string }>();
  const childId = Number(id);
  const meta = subjectMeta(subject);
  const [tab, setTab] = useState<Tab>('active');
  const { data, isLoading, isError, refetch } = useChildAdventures(childId);
  const sync = useAdventureCacheSync();
  const start = useStartAdventure();

  const back = () => router.replace({ pathname: '/children/[id]/home', params: { id: String(id) } });

  if (!meta) {
    return (
      <Screen testID="subject-screen">
        <TopBar onBack={back} />
        <Notice>This subject isn’t available.</Notice>
      </Screen>
    );
  }

  const mine = (data ?? []).filter((a) => a.subject === meta.slug);
  const list = tab === 'active'
    ? mine.filter((a) => a.status === 'active' || a.status === 'draft')
    : mine.filter((a) => a.status === 'completed');

  const add = () => {
    start.mutate({ data: { childId, subject: meta.slug } }, {
      onSuccess: (a) => {
        sync(a);
        router.push({ pathname: '/adventures/[adventureId]', params: { adventureId: String(a.id) } });
      },
    });
  };

  return (
    <Screen testID="subject-screen">
      <TopBar
        onBack={back}
        titleContent={
          <View style={styles.headerTitle}>
            <View style={[styles.headerIcon, { backgroundColor: c.secondary }]}>
              <MaterialCommunityIcons name={meta.icon} size={18} color={c.primary} />
            </View>
            <Text accessibilityRole="header" numberOfLines={1} style={[styles.name, { color: c.foreground }]}>{meta.title}</Text>
          </View>
        }
      />
      <View style={[styles.tabs, { backgroundColor: c.muted, borderRadius: c.radius }]} accessibilityRole="tablist">
        {(['active', 'completed'] as Tab[]).map((t) => {
          const sel = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={t === 'active' ? 'Active adventures' : 'Completed adventures'}
              testID={`tab-${t}`}
              style={[styles.tab, { backgroundColor: sel ? c.card : 'transparent', borderRadius: c.radius - 2 }]}
            >
              <Text style={[styles.tabText, { color: sel ? c.foreground : c.mutedForeground }]}>{t === 'active' ? 'Active' : 'Completed'}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center} testID="adventures-loading"><ActivityIndicator color={c.primary} /></View>
      ) : isError ? (
        <View>
          <Notice tone="error" testID="adventures-error">We couldn’t load learning adventures.</Notice>
          <Button label="Try again" variant="secondary" onPress={() => refetch()} testID="adventures-retry" />
        </View>
      ) : (
        <View style={styles.list} testID={`adventure-list-${tab}`}>
          {list.length === 0 ? (
            <Text style={[styles.empty, { color: c.mutedForeground }]}>
              {tab === 'active' ? 'No learning adventures yet.' : 'No completed learning adventures yet.'}
            </Text>
          ) : list.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push({ pathname: '/adventures/[adventureId]', params: { adventureId: String(a.id) } })}
              accessibilityRole="button"
              accessibilityLabel={`${a.plan?.title ?? a.title}. ${a.status === 'draft' ? 'Draft, not active' : a.status}`}
              testID={`adventure-${a.id}`}
              style={({ pressed }) => [styles.row, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={{ flex: 1, gap: 7 }}>
                <Text style={[styles.rowTitle, { color: c.foreground }]} numberOfLines={2}>{a.plan?.title ?? a.title}</Text>
                <StatusBadge status={a.status} />
              </View>
              <Feather name="chevron-right" size={18} color={c.mutedForeground} />
            </Pressable>
          ))}
          {tab === 'active' ? (
            <>
              {start.isError ? <Notice tone="error" testID="add-adventure-error">{errorText(start.error, 'We couldn’t start a learning adventure.')}</Notice> : null}
              <Button
                label="Add a learning adventure"
                onPress={add}
                loading={start.isPending}
                icon={<Feather name="plus" size={18} color={c.primaryForeground} />}
                testID="add-adventure-button"
              />
            </>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, marginLeft: 10 },
  headerIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 21, letterSpacing: -0.3 },
  tabs: { flexDirection: 'row', padding: 4, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontFamily: fonts.medium, fontSize: 14 },
  center: { paddingVertical: 40, alignItems: 'center' },
  list: { gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14 },
  rowTitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 21 },
});
