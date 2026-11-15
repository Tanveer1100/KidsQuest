import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, Redirect, useRouter } from 'expo-router';
import { useAuth, useSignIn } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { Button, Divider, Field, Notice, Screen, Title, TopBar } from '@/components/ui';
import { GoogleButton } from '@/components/GoogleButton';
import { CodeStep } from '@/components/CodeStep';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { clerkMessage } from '@/lib/reference-data';

export default function SignIn() {
  const c = useColors();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const onGoogleError = useCallback((m: string | null) => setMessage(m), []);

  const busy = submitting || fetchStatus === 'fetching';
  const globalErr = errors.global?.[0] ? clerkMessage(errors.global[0]) : null;

  const finish = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setMessage('Your account needs one more step before it can be used. Please try again shortly.');
          return;
        }
        const url = decorateUrl('/children');
        if (Platform.OS === 'web' && url.startsWith('http')) {
          window.location.href = url;
        } else {
          router.replace(url as Href);
        }
      },
    });
  };

  const handleSubmit = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password });
      if (error) return;
      if (signIn.status === 'complete') {
        await finish();
      } else if (signIn.status === 'needs_second_factor') {
        setMessage('This account uses an extra sign-in step that isn’t supported in this app yet.');
      } else if (signIn.status === 'needs_client_trust') {
        const emailCodeFactor = signIn.supportedSecondFactors.find((f) => f.strategy === 'email_code');
        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
        } else {
          setMessage('We need to confirm this device, but no email option is available for this account.');
        }
      } else {
        setMessage('Sign-in is not complete yet. Please try again.');
      }
    } catch (err) {
      setMessage(clerkMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      await signIn.mfa.verifyEmailCode({ code });
      if (signIn.status === 'complete') {
        await finish();
      } else if (!errors.fields.code) {
        setMessage('That didn’t complete sign-in. Please check the code or request a new one.');
      }
    } catch (err) {
      setMessage(clerkMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (isSignedIn) return <Redirect href="/children" />;

  const trust = signIn.status === 'needs_client_trust';

  return (
    <Screen testID="sign-in-screen">
      <TopBar
        onBack={() => (trust ? void signIn.reset() : router.canGoBack() ? router.back() : router.replace('/'))}
        title="Kids Learning"
      />
      {trust ? (
        <CodeStep
          email={emailAddress}
          title="Confirm it’s you"
          sub="You’re signing in from a new device. We emailed you a 6-digit code."
          code={code}
          setCode={setCode}
          codeError={errors.fields.code?.message}
          message={message ?? globalErr}
          loading={busy}
          onVerify={handleVerify}
          onResend={async () => {
            const result = await signIn.mfa.sendEmailCode();
            if (result?.error) throw result.error;
          }}
          onStartOver={() => {
            setCode('');
            setMessage(null);
            void signIn.reset();
          }}
        />
      ) : (
        <View>
          <Title sub="Sign in to see your children’s profiles.">Welcome back</Title>
          {message || globalErr ? <Notice tone="error" testID="sign-in-error">{message ?? globalErr}</Notice> : null}
          <Field
            label="Email"
            value={emailAddress}
            onChangeText={setEmailAddress}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            error={errors.fields.identifier?.message}
            testID="sign-in-email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry={!showPw}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => emailAddress && password && handleSubmit()}
            error={errors.fields.password?.message}
            testID="sign-in-password"
            right={
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} accessibilityRole="button" accessibilityLabel={showPw ? 'Hide password' : 'Show password'} testID="toggle-password">
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={c.mutedForeground} />
              </Pressable>
            }
          />
          <Button label="Sign in" onPress={handleSubmit} loading={busy} disabled={!emailAddress || !password} testID="sign-in-submit" />
          <Divider label="or" />
          <GoogleButton onError={onGoogleError} />
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: c.mutedForeground }]}>New here?</Text>
            <Pressable onPress={() => router.replace('/sign-up')} accessibilityRole="link" testID="go-sign-up" hitSlop={8}>
              <Text style={[styles.switchLink, { color: c.primary }]}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View nativeID="clerk-captcha" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 },
  switchText: { fontFamily: fonts.regular, fontSize: 15 },
  switchLink: { fontFamily: fonts.semibold, fontSize: 15 },
});
