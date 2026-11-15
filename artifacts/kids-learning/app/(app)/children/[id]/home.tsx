import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Notice, Screen, Title, TopBar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { useMyChildren } from '@/lib/session';
import { ageLabel } from '@/lib/reference-data';

const SUBJECTS = [
  { title: 'Math', icon: 'calculator-variant', activePlans: 0 },
  { title: 'English reading', icon: 'book-open-page-variant', activePlans: 0 },
  { title: 'Science', icon: 'flask-outline', activePlans: 0 },
  { title: 'Second language', icon: 'translate', activePlans: 0 },
] as const;

export default function ChildHome() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useMyChildren();
  const child = data?.find((profile) => String(profile.id) === id);
  const backToProfile = () => router.replace({ pathname: '/children/[id]', params: { id } });
  const backToChildren = () => router.replace('/children');

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
        <Text style={[styles.subjectHeading, { color: c.foreground }]}>Your subjects</Text>
        <View style={styles.topicList} testID="topic-list">
          {SUBJECTS.map((subject) => (
            <View
              key={subject.title}
              accessible
              accessibilityLabel={`${subject.title}. Ready to explore. ${subject.activePlans} active learning plans.`}
              style={[
                styles.topicCard,
                { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 },
              ]}
              testID={`topic-${subject.title.toLowerCase().replace(/ /g, '-')}`}
            >
              <View style={[styles.subjectIcon, { backgroundColor: c.secondary }]}>
                <MaterialCommunityIcons name={subject.icon} size={22} color={c.primary} />
              </View>
              <View style={styles.topicDescription}>
                <Text style={[styles.subjectName, { color: c.foreground }]}>{subject.title}</Text>
                <View style={[styles.stageBadge, { backgroundColor: c.muted, borderRadius: c.radius }]}>
                  <Text style={[styles.stageText, { color: c.secondaryForeground }]}>Ready to explore</Text>
                </View>
              </View>
              <View style={styles.planCount}>
                <Text style={[styles.planNumber, { color: c.foreground }]}>{subject.activePlans}</Text>
                <Text style={[styles.planLabel, { color: c.mutedForeground }]}>active plans</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.note, { backgroundColor: c.secondary, borderRadius: c.radius + 4 }]}>
          <Text style={[styles.noteTitle, { color: c.foreground }]}>Every subject has its own journey</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>
            New learning activities will arrive in a future update.
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
        onBack={backToChildren}
        title={child ? `${child.nickname}’s home` : 'Child home'}
      />
      {child && !isError && !isLoading ? (
      <Title sub="Each subject brings something new to discover.">Welcome, {child.nickname}</Title>
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
  subjectHeading: { fontFamily: fonts.semibold, fontSize: 19 },
  topicList: { gap: 12 },
  topicCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, minHeight: 86 },
  subjectIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topicDescription: { flex: 1, gap: 7 },
  subjectName: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 21 },
  stageBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6 },
  stageText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  planCount: { minWidth: 66, alignItems: 'center', justifyContent: 'center' },
  planNumber: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24 },
  planLabel: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'center', lineHeight: 14 },
  note: { padding: 18, gap: 6 },
  noteTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  helper: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
