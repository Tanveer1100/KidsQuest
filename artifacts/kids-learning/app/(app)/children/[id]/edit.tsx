import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUpdateChild,
  type ChildProfile,
  type UpdateChildInputAgeBucket,
} from '@workspace/api-client-react';
import { Button, Notice, Screen, SelectField, Title, TopBar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { childrenKey, useMyChildren } from '@/lib/session';
import { AGE_BUCKETS, COUNTRY_OPTIONS, LANGUAGE_OPTIONS, countryName } from '@/lib/reference-data';

type EditErrors = Partial<Record<'ageBucket' | 'defaultLanguage' | 'countryOfResidence', string>>;

export default function EditChildProfile() {
  const c = useColors();
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { data, isLoading, isError, refetch } = useMyChildren();
  const child = data?.find((profile) => String(profile.id) === id);
  const backToSource = () => {
    if (id && returnTo === 'home') {
      router.replace({ pathname: '/children/[id]/home', params: { id } });
    } else if (child) {
      router.replace({ pathname: '/children/[id]', params: { id: String(child.id) } });
    } else {
      router.replace('/children');
    }
  };

  if (isLoading) {
    return (
      <Screen testID="edit-child-loading">
        <TopBar onBack={backToSource} title="Edit profile" />
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
          <Text style={[styles.helper, { color: c.mutedForeground }]}>Loading profile…</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen testID="edit-child-error">
        <TopBar onBack={backToSource} title="Edit profile" />
        <Notice tone="error">We couldn’t load this profile.</Notice>
        <Button label="Try again" variant="secondary" onPress={() => refetch()} testID="edit-child-retry" />
      </Screen>
    );
  }

  if (!child) {
    return (
      <Screen testID="edit-child-missing">
        <TopBar onBack={backToSource} title="Edit profile" />
        <Notice>This profile isn’t available on your account.</Notice>
        <Button label="Back to profiles" variant="secondary" onPress={backToSource} testID="edit-child-missing-back" />
      </Screen>
    );
  }

  return <EditChildForm child={child} returnToHome={returnTo === 'home'} />;
}

function EditChildForm({ child, returnToHome }: { child: ChildProfile; returnToHome: boolean }) {
  const c = useColors();
  const router = useRouter();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [ageBucket, setAgeBucket] = useState<UpdateChildInputAgeBucket>(child.ageBucket);
  const [language, setLanguage] = useState<string>(child.defaultLanguage);
  const [country, setCountry] = useState<string>(child.countryOfResidence);
  const [errors, setErrors] = useState<EditErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const backToProfile = () => router.replace({
    pathname: '/children/[id]',
    params: { id: String(child.id) },
  });

  const update = useUpdateChild({
    mutation: {
      onSuccess: (updated: ChildProfile) => {
        const key = childrenKey(userId);
        queryClient.setQueryData<ChildProfile[]>(key, (old) =>
          old?.map((profile) => profile.id === updated.id ? updated : profile),
        );
        void queryClient.invalidateQueries({ queryKey: key });
        if (returnToHome) {
          router.replace({ pathname: '/children/[id]/home', params: { id: String(updated.id) } });
        } else {
          router.replace({
            pathname: '/children/[id]',
            params: { id: String(updated.id), updated: '1' },
          });
        }
      },
    },
  });

  const save = async () => {
    setServerError(null);
    const nextErrors: EditErrors = {};
    if (language.trim().length < 2) nextErrors.defaultLanguage = 'Please choose a language.';
    if (!country) nextErrors.countryOfResidence = 'Please choose a country.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await update.mutateAsync({
        id: child.id,
        data: {
          ageBucket,
          defaultLanguage: language.trim(),
          countryOfResidence: country,
        },
      });
    } catch (error) {
      const data = (error as { data?: { error?: string } | null }).data;
      setServerError(data?.error ?? 'We couldn’t update this profile. Please check your connection and try again.');
    }
  };

  return (
    <Screen
      testID="edit-child-screen"
      footer={<Button label="Save changes" onPress={save} loading={update.isPending} testID="save-child-changes" />}
    >
      <TopBar onBack={backToProfile} title="Edit profile" />
      <Title sub="Your child’s nickname stays the same. You can update the other details.">Profile details</Title>

      {serverError ? <Notice tone="error" testID="edit-child-server-error">{serverError}</Notice> : null}

      <View style={styles.field} testID="nickname-readonly">
        <Text style={[styles.label, { color: c.foreground }]}>Nickname</Text>
        <View style={[styles.readOnlyValue, { backgroundColor: c.muted, borderColor: c.border, borderRadius: c.radius }]}>
          <Text style={[styles.nickname, { color: c.mutedForeground }]}>{child.nickname}</Text>
        </View>
        <Text style={[styles.hint, { color: c.mutedForeground }]}>Nicknames can’t be changed here.</Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: c.foreground }]}>Age range</Text>
        <View style={styles.segments} accessibilityRole="radiogroup">
          {AGE_BUCKETS.map((option) => {
            const selected = ageBucket === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setAgeBucket(option.value);
                  setErrors((previous) => ({ ...previous, ageBucket: undefined }));
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Ages ${option.label}`}
                testID={`edit-age-${option.value}`}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    borderRadius: c.radius,
                    backgroundColor: selected ? c.primary : c.card,
                    borderColor: selected ? c.primary : c.input,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.segmentText, { color: selected ? c.primaryForeground : c.foreground }]}>
                  {option.label}
                </Text>
                <Text style={[styles.segmentSub, { color: selected ? c.primaryForeground : c.mutedForeground }]}>
                  years
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.ageBucket ? <Text style={[styles.error, { color: c.destructive }]}>{errors.ageBucket}</Text> : null}
      </View>

      <SelectField
        label="Default language"
        placeholder="Choose a language"
        searchPlaceholder="Search languages"
        value={language}
        display={language}
        options={LANGUAGE_OPTIONS}
        onChange={(value) => {
          setLanguage(value);
          setErrors((previous) => ({ ...previous, defaultLanguage: undefined }));
        }}
        error={errors.defaultLanguage}
        testID="edit-language-select"
      />

      <SelectField
        label="Country of residence"
        placeholder="Choose a country"
        searchPlaceholder="Search countries"
        value={country}
        display={countryName(country)}
        options={COUNTRY_OPTIONS}
        onChange={(value) => {
          setCountry(value);
          setErrors((previous) => ({ ...previous, countryOfResidence: undefined }));
        }}
        error={errors.countryOfResidence}
        testID="edit-country-select"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  helper: { fontFamily: fonts.regular, fontSize: 15 },
  field: { marginBottom: 18 },
  label: { fontFamily: fonts.medium, fontSize: 14, marginBottom: 8 },
  readOnlyValue: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  nickname: { fontFamily: fonts.medium, fontSize: 16 },
  hint: { fontFamily: fonts.regular, fontSize: 12, marginTop: 6 },
  segments: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  segmentText: { fontFamily: fonts.semibold, fontSize: 17 },
  segmentSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  error: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },
});
