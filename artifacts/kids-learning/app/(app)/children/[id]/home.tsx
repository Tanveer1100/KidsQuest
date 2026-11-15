import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button, Notice, Screen, Title, TopBar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { useMyChildren } from '@/lib/session';
import { ageLabel } from '@/lib/reference-data';

export default function ChildHome() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useMyChildren();
  const child = data?.find((profile) => String(profile.id) === id);
  const backToProfile = () => router.replace({ pathname: '/children/[id]', params: { id } });

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <View style={styles.center} testID="child-home-loading">
        <ActivityIndicator color={c.primary} />
        <Text style={[styles.helper, { color: c.mutedForeground }]}>Opening your home…</Text>
      </View>
    );
  } else if (isError) {
    content = (
      <View style={styles.stack}>
        <Notice tone="error">We couldn’t open this home.</Notice>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} testID="child-home-retry" />
      </View>
    );
  } else if (!child) {
    content = (
      <View style={styles.stack}>
        <Notice>This home isn’t available on your account.</Notice>
        <Button label="Back to profiles" variant="secondary" onPress={() => router.replace('/children')} testID="child-home-missing-back" />
      </View>
    );
  } else {
    content = (
      <View style={styles.stack} testID="child-home-content">
        <View style={[styles.welcome, { backgroundColor: c.secondary, borderRadius: c.radius + 8 }]}>
          <View style={[styles.icon, { backgroundColor: c.background }]}>
            <Feather name="home" size={24} color={c.primary} />
          </View>
          <Text accessibilityRole="header" style={[styles.greeting, { color: c.foreground }]}>
            Welcome home, {child.nickname}
          </Text>
          <Text style={[styles.age, { color: c.secondaryForeground }]}>
            Ages {ageLabel(child.ageBucket)}
          </Text>
        </View>
        <View style={[styles.note, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
          <Text style={[styles.noteTitle, { color: c.foreground }]}>Your learning home</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>
            Learning activities aren’t part of this first version yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Screen
      testID="child-home-screen"
      footer={child ? <Button label="View profile" variant="secondary" onPress={backToProfile} testID="child-home-profile-button" /> : null}
    >
      <TopBar
        onBack={backToProfile}
        title={child ? `${child.nickname}’s home` : 'Child home'}
      />
      {child && !isError && !isLoading ? (
        <Title sub="A welcoming place for your learning journey.">Welcome, {child.nickname}</Title>
      ) : null}
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stack: { gap: 16 },
  welcome: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  greeting: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32, textAlign: 'center' },
  age: { fontFamily: fonts.medium, fontSize: 14, marginTop: 8 },
  note: { borderWidth: 1, padding: 18, gap: 6 },
  noteTitle: { fontFamily: fonts.semibold, fontSize: 16 },
  helper: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
