import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO, useSignIn } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { clerkMessage } from '@/lib/reference-data';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export function GoogleButton({ onError }: { onError: (msg: string | null) => void }) {
  useWarmUpBrowser();
  const c = useColors();
  const { startSSOFlow } = useSSO();
  const { signIn } = useSignIn();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(async () => {
    onError(null);
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        // Browser preview: full-page redirect, completed on /sso-callback.
        const origin = window.location.origin;
        const { error } = await signIn.sso({
          strategy: 'oauth_google',
          redirectUrl: `${origin}/children`,
          redirectCallbackUrl: `${origin}/sso-callback`,
        });
        if (error) {
          onError(clerkMessage(error, 'Google sign-in could not start.'));
          setBusy(false);
        }
        return;
      }

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              onError('Your account needs one more step before it can be used. Please try again shortly.');
              return;
            }
            router.replace(decorateUrl('/children') as Href);
          },
        });
      } else {
        onError('Google sign-in was not completed. You can try again or use email instead.');
      }
    } catch (err) {
      onError(clerkMessage(err, 'Google sign-in did not finish. Please try again.'));
    } finally {
      if (Platform.OS !== 'web') setBusy(false);
    }
  }, [onError, router, signIn, startSSOFlow]);

  return (
    <Button
      label="Continue with Google"
      variant="secondary"
      onPress={onPress}
      loading={busy}
      testID="google-button"
      icon={<AntDesign name="google" size={18} color={c.foreground} />}
    />
  );
}
