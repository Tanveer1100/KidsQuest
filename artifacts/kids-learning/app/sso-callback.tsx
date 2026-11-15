import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/expo';
import { Button, Notice, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { clerkMessage } from '@/lib/reference-data';

/** Browser-preview landing route that completes the Google redirect. */
export default function SSOCallback() {
  const c = useColors();
  const clerk = useClerk();
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    clerk
      .handleRedirectCallback(
        {
          signInFallbackRedirectUrl: '/children',
          signUpFallbackRedirectUrl: '/children',
          signInUrl: '/sign-in',
          signUpUrl: '/sign-up',
        },
        async (to: string) => router.replace(to as never),
      )
      .catch((err: unknown) => setError(clerkMessage(err, 'Google sign-in did not finish.')));
  }, [clerk, router]);

  return (
    <Screen scroll={false} testID="sso-callback-screen">
      <View style={styles.center}>
        {error ? (
          <View style={{ width: '100%' }}>
            <Notice tone="error">{error}</Notice>
            <Button label="Back to sign in" onPress={() => router.replace('/sign-in')} testID="sso-back" />
          </View>
        ) : (
          <>
            <ActivityIndicator color={c.primary} />
            <Text style={[styles.text, { color: c.mutedForeground }]}>Finishing sign-in…</Text>
          </>
        )}
      </View>
      <View nativeID="clerk-captcha" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  text: { fontFamily: fonts.regular, fontSize: 15 },
});
