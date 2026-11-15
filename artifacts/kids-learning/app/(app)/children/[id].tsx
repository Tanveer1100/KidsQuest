import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Notice, Screen, TopBar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { useMyChildren } from '@/lib/session';
import { ageLabel, countryName } from '@/lib/reference-data';

export default function ChildProfileScreen() {
  const c = useColors();
  const router = useRouter();
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const { data, isLoading, isError, refetch } = useMyChildren();
  const child = data?.find((ch) => String(ch.id) === id);
  const back = () => router.replace('/children');
  const footer = child ? (
    <View style={{ gap: 10 }}>
      <Button
        label={`Go to ${child.nickname}’s home`}
        onPress={() => router.push({ pathname: '/children/[id]/home', params: { id: String(child.id) } })}
        testID="child-home-button"
      />
      <Button label="Back to all children" variant="ghost" onPress={back} testID="child-done" />
    </View>
  ) : (
    <Button label="Back to all children" variant="secondary" onPress={back} testID="child-done" />
  );

  let body: React.ReactNode;
  if (isLoading) {
    body = <View style={[styles.skeleton, { backgroundColor: c.muted, borderRadius: c.radius + 6 }]} testID="child-loading" />;
  } else if (isError) {
    body = (
      <>
        <Notice tone="error">We couldn’t load this profile.</Notice>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} testID="child-retry" />
      </>
    );
  } else if (!child) {
    body = (
      <>
        <Notice>This profile isn’t available on your account.</Notice>
        <Button label="Back to your children" variant="secondary" onPress={back} testID="child-missing-back" />
      </>
    );
  } else {
    const rows = [
      { label: 'Age range', value: `${ageLabel(child.ageBucket)} years` },
      { label: 'Default language', value: child.defaultLanguage },
      { label: 'Country of residence', value: countryName(child.countryOfResidence) },
      {
        label: 'Created',
        value: new Date(child.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
      },
    ];
    body = (
      <>
        {saved ? (
          <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(450)} style={[styles.saved, { backgroundColor: c.secondary, borderRadius: c.radius }]} testID="saved-banner">
            <Feather name="check" size={16} color={c.success} />
            <Text style={[styles.savedText, { color: c.secondaryForeground }]}>Profile saved</Text>
          </Animated.View>
        ) : null}
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(80).duration(500)} style={styles.head}>
          <View style={[styles.initial, { backgroundColor: c.accent }]}>
            <Text style={[styles.initialText, { color: c.accentForeground }]}>{child.nickname.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.name, { color: c.foreground }]}>{child.nickname}</Text>
        </Animated.View>
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(160).duration(500)} style={[styles.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <Text style={[styles.rowLabel, { color: c.mutedForeground }]}>{r.label}</Text>
              <Text style={[styles.rowValue, { color: c.foreground }]}>{r.value}</Text>
            </View>
          ))}
        </Animated.View>
        <Text style={[styles.private, { color: c.mutedForeground }]}>Only you can see this profile.</Text>
      </>
    );
  }

  return (
    <Screen testID="child-profile-screen" footer={footer}>
      <TopBar onBack={back} title="Profile" />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeleton: { height: 260 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 24 },
  savedText: { fontFamily: fonts.medium, fontSize: 14 },
  head: { alignItems: 'flex-start', marginBottom: 24 },
  initial: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  initialText: { fontFamily: fonts.semibold, fontSize: 26 },
  name: { fontFamily: fonts.semibold, fontSize: 32, letterSpacing: -0.6 },
  card: { borderWidth: 1, paddingHorizontal: 18 },
  row: { paddingVertical: 16 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 4 },
  rowValue: { fontFamily: fonts.medium, fontSize: 17 },
  private: { fontFamily: fonts.regular, fontSize: 13, marginTop: 16, textAlign: 'center' },
});
