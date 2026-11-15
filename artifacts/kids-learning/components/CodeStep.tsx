import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Notice, Title } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { clerkMessage } from '@/lib/reference-data';

const COOLDOWN = 30;

/** Shared "enter the code we emailed you" step with resend cooldown. */
export function CodeStep({
  email,
  title,
  sub,
  code,
  setCode,
  codeError,
  message,
  loading,
  onVerify,
  onResend,
  onStartOver,
}: {
  email: string;
  title: string;
  sub: string;
  code: string;
  setCode: (v: string) => void;
  codeError?: string | null;
  message?: string | null;
  loading: boolean;
  onVerify: () => void;
  onResend: () => Promise<void>;
  onStartOver: () => void;
}) {
  const c = useColors();
  const [left, setLeft] = useState(COOLDOWN);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const resend = async () => {
    setResending(true);
    setResent(false);
    setResendError(null);
    try {
      await onResend();
      setResent(true);
      setLeft(COOLDOWN);
    } catch (error) {
      setResendError(clerkMessage(error, 'We could not send another code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <View>
      <Title sub={sub}>{title}</Title>
      <View style={[styles.emailPill, { backgroundColor: c.muted, borderRadius: c.radius }]}>
        <Text style={[styles.emailText, { color: c.foreground }]} numberOfLines={1}>{email}</Text>
      </View>
      {message ? <Notice tone="error" testID="code-error">{message}</Notice> : null}
      {resendError ? <Notice tone="error">{resendError}</Notice> : null}
      {resent ? <Notice>A new code is on its way.</Notice> : null}
      <Field
        label="Verification code"
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="6-digit code"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        returnKeyType="done"
        onSubmitEditing={onVerify}
        error={codeError}
        testID="code-input"
      />
      <Button label="Verify" onPress={onVerify} loading={loading} disabled={code.length < 6} testID="verify-button" />
      <View style={styles.row}>
        <Pressable
          onPress={resend}
          disabled={left > 0 || resending}
          accessibilityRole="button"
          accessibilityState={{ disabled: left > 0 || resending }}
          testID="resend-code"
          hitSlop={8}
        >
          <Text style={[styles.link, { color: left > 0 || resending ? c.mutedForeground : c.primary }]}>
            {resending ? 'Sending…' : left > 0 ? `Send a new code in ${left}s` : 'Send a new code'}
          </Text>
        </Pressable>
        <Pressable onPress={onStartOver} accessibilityRole="button" testID="start-over" hitSlop={8}>
          <Text style={[styles.link, { color: c.mutedForeground }]}>Start over</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emailPill: { paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, alignSelf: 'flex-start', maxWidth: '100%' },
  emailText: { fontFamily: fonts.medium, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  link: { fontFamily: fonts.medium, fontSize: 14 },
});
