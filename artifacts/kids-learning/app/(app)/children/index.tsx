import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useClerk, useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Notice } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { useMyChildren } from '@/lib/session';
import { ageLabel, countryName } from '@/lib/reference-data';

export default function ChildrenList() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useMyChildren();
  const [leaving, setLeaving] = useState(false);
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const logout = async () => {
    setLeaving(true);
    try {
      await signOut();
      queryClient.clear();
      router.replace('/');
    } finally {
      setLeaving(false);
    }
  };

  const email = user?.primaryEmailAddress?.emailAddress;
  const list = data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }} testID="children-screen">
      <ScrollView
        contentContainerStyle={{ paddingTop: top + 12, paddingBottom: bottom + 28, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={c.primary} />}
      >
        <View style={styles.column}>
          <View style={styles.header}>
            <Text style={[styles.small, { color: c.mutedForeground }]} numberOfLines={1}>
              {email ? `Signed in as ${email}` : 'Kids Learning'}
            </Text>
            <Pressable
              onPress={logout}
              disabled={leaving}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              testID="logout-button"
              hitSlop={8}
              style={({ pressed }) => [styles.logout, { borderColor: c.border, opacity: pressed || leaving ? 0.6 : 1 }]}
            >
              {leaving ? <ActivityIndicator size="small" color={c.mutedForeground} /> : <Feather name="log-out" size={14} color={c.mutedForeground} />}
              <Text style={[styles.logoutText, { color: c.mutedForeground }]}>Log out</Text>
            </Pressable>
          </View>

          <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>Your children</Text>

          {isLoading ? (
            <View style={{ gap: 12, marginTop: 24 }} testID="children-loading">
              {[0, 1].map((i) => (
                <View key={i} style={[styles.skeleton, { backgroundColor: c.muted, borderRadius: c.radius + 4 }]} />
              ))}
            </View>
          ) : isError ? (
            <View style={{ marginTop: 24 }}>
              <Notice tone="error" testID="children-error">We couldn’t load your profiles. Check your connection and try again.</Notice>
              <Button label="Try again" variant="secondary" onPress={() => refetch()} testID="children-retry" />
            </View>
          ) : list.length === 0 ? (
            <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(500)} style={[styles.empty, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 6 }]} testID="children-empty">
              <View style={styles.emptyMarks}>
                <View style={[styles.dot, { backgroundColor: c.secondary }]} />
                <View style={[styles.dot, { backgroundColor: c.accent, marginLeft: -14 }]} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No profiles yet</Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                Add a profile for each child. It only takes a nickname, an age range, a language and a country.
              </Text>
            </Animated.View>
          ) : null}

          {!isLoading && !isError && list.length > 0 ? (
            <View style={{ gap: 12, marginTop: 24 }}>
              {list.map((child, i) => (
                <Animated.View key={child.id} entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(i * 60).duration(450)}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/children/[id]/home', params: { id: String(child.id) } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${child.nickname}’s learning home, ages ${ageLabel(child.ageBucket)}`}
                    testID={`child-card-${child.id}`}
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.initial, { backgroundColor: i % 2 ? c.accent : c.secondary }]}>
                      <Text style={[styles.initialText, { color: i % 2 ? c.accentForeground : c.secondaryForeground }]}>
                        {child.nickname.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>{child.nickname}</Text>
                      <Text style={[styles.meta, { color: c.mutedForeground }]} numberOfLines={1}>
                        Ages {ageLabel(child.ageBucket)} · {child.defaultLanguage} · {countryName(child.countryOfResidence)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={c.mutedForeground} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}

          <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(list.length * 60).duration(450)}>
            <Pressable
              onPress={() => router.push('/children/new')}
              accessibilityRole="button"
              accessibilityLabel="Add a child profile"
              testID="add-profile-button"
              style={({ pressed }) => [
                styles.addCard,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.initial, { backgroundColor: c.secondary }]}>
                <Feather name="plus" size={20} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.foreground }]}>Add profile</Text>
                <Text style={[styles.meta, { color: c.mutedForeground }]}>Create a profile for another child</Text>
              </View>
              <Feather name="chevron-right" size={18} color={c.mutedForeground} />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28, minHeight: 40 },
  small: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  logoutText: { fontFamily: fonts.medium, fontSize: 13 },
  title: { fontFamily: fonts.semibold, fontSize: 30, letterSpacing: -0.6 },
  skeleton: { height: 76 },
  empty: { marginTop: 24, borderWidth: 1, padding: 24, alignItems: 'flex-start' },
  emptyMarks: { flexDirection: 'row', marginBottom: 18 },
  dot: { width: 36, height: 36, borderRadius: 18 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 18, marginBottom: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 16 },
  initial: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontFamily: fonts.semibold, fontSize: 18 },
  name: { fontFamily: fonts.semibold, fontSize: 17 },
  meta: { fontFamily: fonts.regular, fontSize: 13, marginTop: 3 },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderStyle: 'dashed', padding: 16, marginTop: 14 },
});
