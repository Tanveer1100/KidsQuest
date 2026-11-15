import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Button, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';

const POINTS: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: 'lock', text: 'Your account and your children’s profiles are visible only to you.' },
  { icon: 'feather', text: 'A nickname is enough. No photos, no exact birthdays.' },
  { icon: 'sliders', text: 'You choose the language and country for each child.' },
];

export default function Welcome() {
  const c = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  if (isSignedIn) return <Redirect href="/children" />;

  return (
    <Screen
      testID="welcome-screen"
      footer={
        <View style={{ gap: 10 }}>
          <Button label="Create a parent account" onPress={() => router.push('/sign-up')} testID="welcome-sign-up" />
          <Button label="I already have an account" variant="ghost" onPress={() => router.push('/sign-in')} testID="welcome-sign-in" />
        </View>
      }
    >
      <View style={styles.hero}>
        <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(700)} style={styles.marks}>
          <View style={[styles.disc, { backgroundColor: c.secondary }]} />
          <View style={[styles.disc, styles.disc2, { backgroundColor: c.accent }]} />
          <View style={[styles.disc, styles.disc3, { backgroundColor: c.primary, opacity: 0.85 }]} />
        </Animated.View>
        <Animated.Text
          entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(120).duration(700)}
          accessibilityRole="header"
          style={[styles.brand, { color: c.foreground }]}
        >
          Kids Learning
        </Animated.Text>
        <Animated.Text entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(220).duration(700)} style={[styles.lede, { color: c.mutedForeground }]}>
          A private, unhurried place to set up your children’s learning profiles.
        </Animated.Text>
      </View>

      <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(360).duration(700)} style={[styles.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
        {POINTS.map((p, i) => (
          <View key={p.icon} style={[styles.point, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <View style={[styles.pointIcon, { backgroundColor: c.secondary }]}>
              <Feather name={p.icon} size={15} color={c.secondaryForeground} />
            </View>
            <Text style={[styles.pointText, { color: c.foreground }]}>{p.text}</Text>
          </View>
        ))}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 28, paddingBottom: 36 },
  marks: { width: 96, height: 64, marginBottom: 28 },
  disc: { position: 'absolute', width: 56, height: 56, borderRadius: 28, left: 0, top: 4 },
  disc2: { left: 22, top: 0 },
  disc3: { width: 22, height: 22, borderRadius: 11, left: 64, top: 38 },
  brand: { fontFamily: fonts.semibold, fontSize: 40, lineHeight: 46, letterSpacing: -1.2 },
  lede: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 27, marginTop: 14, maxWidth: 360 },
  card: { borderWidth: 1, paddingHorizontal: 18 },
  point: { flexDirection: 'row', gap: 14, paddingVertical: 16, alignItems: 'flex-start' },
  pointIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pointText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, paddingTop: 4 },
});
