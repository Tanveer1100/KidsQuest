import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Notice, Screen, TopBar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { useMyChildren } from '@/lib/session';

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
      </View>
    );
  }

  return (
    <Screen testID="child-home-screen">
      <TopBar
        onBack={backToChildren}
        titleContent={
          <View style={styles.headerTitle} testID="child-home-title">
            <View style={[styles.headerIcon, { backgroundColor: c.secondary }]}>
              <Feather name="smile" size={19} color={c.primary} />
            </View>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={[styles.childName, { color: c.foreground }]}
            >
              {child?.nickname ?? 'Child'}
            </Text>
          </View>
        }
        right={child ? (
          <Pressable
            onPress={() => router.push({ pathname: '/children/[id]/edit', params: { id: String(child.id), returnTo: 'home' } })}
            accessibilityRole="button"
            accessibilityLabel="Edit child profile"
            testID="edit-child-home-button"
            hitSlop={8}
            style={({ pressed }) => [styles.editAction, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Feather name="edit-2" size={15} color={c.primary} />
            <Text style={[styles.editText, { color: c.primary }]}>Edit</Text>
          </Pressable>
        ) : null}
      />
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stack: { gap: 16 },
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
  helper: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  headerTitle: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9, marginLeft: 10, marginRight: 6 },
  headerIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  childName: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 21, lineHeight: 27, letterSpacing: -0.3 },
  editAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 4 },
  editText: { fontFamily: fonts.medium, fontSize: 14 },
});
