import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateChild, type ChildProfile, type CreateChildInputAgeBucket } from '@workspace/api-client-react';
import { Button, Field, Notice, Screen, SelectField, Title, TopBar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { childrenKey } from '@/lib/session';
import { AGE_BUCKETS, COUNTRY_OPTIONS, LANGUAGE_OPTIONS, countryName } from '@/lib/reference-data';

type Errors = Partial<Record<'nickname' | 'ageBucket' | 'defaultLanguage' | 'countryOfResidence', string>>;

export default function NewChild() {
  const c = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [nickname, setNickname] = useState('');
  const [ageBucket, setAgeBucket] = useState<CreateChildInputAgeBucket | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const create = useCreateChild({
    mutation: {
      onSuccess: (child: ChildProfile) => {
        const key = childrenKey(userId);
        queryClient.setQueryData<ChildProfile[]>(key, (old) => (old ? [...old, child] : [child]));
        void queryClient.invalidateQueries({ queryKey: key });
      },
    },
  });

  const validate = (): Errors => {
    const e: Errors = {};
    const n = nickname.trim();
    if (!n) e.nickname = 'Please enter a nickname.';
    else if (n.length > 40) e.nickname = 'Keep it to 40 characters or fewer.';
    if (!ageBucket) e.ageBucket = 'Please choose an age range.';
    if (!language) e.defaultLanguage = 'Please choose a language.';
    if (!country) e.countryOfResidence = 'Please choose a country.';
    return e;
  };

  const submit = async () => {
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      const child = await create.mutateAsync({
        data: {
          nickname: nickname.trim(),
          ageBucket: ageBucket!,
          defaultLanguage: language!,
          countryOfResidence: country!,
        },
      });
      router.replace({ pathname: '/children/[id]', params: { id: String(child.id), saved: '1' } });
    } catch (err) {
      const data = (err as { data?: { error?: string } | null; status?: number }).data;
      setServerError(data?.error ?? 'We couldn’t save this profile. Please check your connection and try again.');
    }
  };

  return (
    <Screen
      testID="new-child-screen"
      footer={<Button label="Save profile" onPress={submit} loading={create.isPending} testID="save-child-button" />}
    >
      <TopBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/children'))} title="New profile" />
      <Title sub="Just the basics. You can add more later as the app grows.">About your child</Title>

      {serverError ? <Notice tone="error" testID="create-error">{serverError}</Notice> : null}

      <Field
        label="Nickname"
        value={nickname}
        onChangeText={(v) => {
          setNickname(v);
          if (errors.nickname) setErrors((p) => ({ ...p, nickname: undefined }));
        }}
        placeholder="What you call them"
        maxLength={40}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        error={errors.nickname}
        hint={`${nickname.trim().length}/40 · A nickname is enough — no full name needed.`}
        testID="nickname-input"
      />

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Age range</Text>
        <View style={styles.segments} accessibilityRole="radiogroup">
          {AGE_BUCKETS.map((a) => {
            const sel = ageBucket === a.value;
            return (
              <Pressable
                key={a.value}
                onPress={() => {
                  setAgeBucket(a.value);
                  setErrors((p) => ({ ...p, ageBucket: undefined }));
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`Ages ${a.label}`}
                testID={`age-${a.value}`}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    borderRadius: c.radius,
                    backgroundColor: sel ? c.primary : c.card,
                    borderColor: sel ? c.primary : errors.ageBucket ? c.destructive : c.input,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.segText, { color: sel ? c.primaryForeground : c.foreground }]}>{a.label}</Text>
                <Text style={[styles.segSub, { color: sel ? c.primaryForeground : c.mutedForeground }]}>years</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.ageBucket ? <Text style={[styles.err, { color: c.destructive }]}>{errors.ageBucket}</Text> : null}
      </View>

      <SelectField
        label="Default language"
        placeholder="Choose a language"
        searchPlaceholder="Search languages"
        value={language}
        display={language}
        options={LANGUAGE_OPTIONS}
        onChange={(v) => {
          setLanguage(v);
          setErrors((p) => ({ ...p, defaultLanguage: undefined }));
        }}
        error={errors.defaultLanguage}
        testID="language-select"
      />

      <SelectField
        label="Country of residence"
        placeholder="Choose a country"
        searchPlaceholder="Search countries"
        value={country}
        display={country ? countryName(country) : null}
        options={COUNTRY_OPTIONS}
        onChange={(v) => {
          setCountry(v);
          setErrors((p) => ({ ...p, countryOfResidence: undefined }));
        }}
        error={errors.countryOfResidence}
        testID="country-select"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: { fontFamily: fonts.medium, fontSize: 14, marginBottom: 8 },
  segments: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  segText: { fontFamily: fonts.semibold, fontSize: 17 },
  segSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  err: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },
});
