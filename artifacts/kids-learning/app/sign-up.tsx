import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, Redirect, useRouter } from 'expo-router';
import { useAuth, useSignUp } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { Button, Divider, Field, Notice, Screen, Title, TopBar } from '@/components/ui';
import { GoogleButton } from '@/components/GoogleButton';
import { CodeStep } from '@/components/CodeStep';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { clerkMessage } from '@/lib/reference-data';

export default function SignUp() {
  const c = useColors();
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
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
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setMessage('Your account needs one more step before it can be used. Please try signing in again shortly.');
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
      const { error } = await signUp.password({ emailAddress: emailAddress.trim(), password });
      if (error) return;
      const res = await signUp.verifications.sendEmailCode();
      if (res?.error) setMessage(clerkMessage(res.error, 'We could not send a code. Please try again.'));
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
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status === 'complete') {
        await finish();
      } else if (signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address')) {
        // stay on code step; field error shown below
      } else {
        setMessage('Sign-up is not complete yet. Please start over or contact support if this continues.');
      }
    } catch (err) {
      setMessage(clerkMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (signUp.status === 'complete' || isSignedIn) {
    return <Redirect href="/children" />;
  }

  const verifying =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  return (
    <Screen testID="sign-up-screen">
      <TopBar
        onBack={() => (verifying ? void signUp.reset() : router.canGoBack() ? router.back() : router.replace('/'))}
        title="Kids Learning"
      />
      {verifying ? (
        <CodeStep
          email={signUp.emailAddress ?? emailAddress}
          title="Check your email"
          sub="We sent a 6-digit code to confirm this address belongs to you."
          code={code}
          setCode={setCode}
          codeError={errors.fields.code?.message}
          message={message ?? globalErr}
          loading={busy}
          onVerify={handleVerify}
          onResend={async () => {
            const res = await signUp.verifications.sendEmailCode();
            if (res?.error) throw res.error;
          }}
          onStartOver={() => {
            setCode('');
            setMessage(null);
            void signUp.reset();
          }}
        />
      ) : (
        <View>
          <Title sub="One account for you, the parent. Your children don’t need their own.">Create your account</Title>
          {message || globalErr ? <Notice tone="error" testID="sign-up-error">{message ?? globalErr}</Notice> : null}
          {signUp.status === 'missing_requirements' && signUp.missingFields.length > 0 ? (
            <Notice>
              Your sign-up needs details this app doesn’t collect yet ({signUp.missingFields.join(', ')}). Please start over.
            </Notice>
          ) : null}
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
            error={errors.fields.emailAddress?.message}
            testID="sign-up-email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry={!showPw}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => emailAddress && password && handleSubmit()}
            error={errors.fields.password?.message}
            testID="sign-up-password"
            right={
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} accessibilityRole="button" accessibilityLabel={showPw ? 'Hide password' : 'Show password'} testID="toggle-password">
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={c.mutedForeground} />
              </Pressable>
            }
          />
          <Button label="Continue" onPress={handleSubmit} loading={busy} disabled={!emailAddress || !password} testID="sign-up-submit" />
          <Divider label="or" />
          <GoogleButton onError={onGoogleError} />
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: c.mutedForeground }]}>Already have an account?</Text>
            <Pressable onPress={() => router.replace('/sign-in')} accessibilityRole="link" testID="go-sign-in" hitSlop={8}>
              <Text style={[styles.switchLink, { color: c.primary }]}>Sign in</Text>
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
