import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LearningPlan } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';

export function StatusBadge({ status }: { status: 'draft' | 'active' | 'completed' }) {
  const c = useColors();
  const label = status === 'draft' ? 'Draft, not active' : status === 'active' ? 'Active' : 'Completed by parent';
  const draft = status === 'draft';
  return (
    <View
      style={[styles.badge, { backgroundColor: draft ? c.muted : c.secondary, borderColor: draft ? c.input : 'transparent', borderRadius: c.radius }]}
      testID={`status-badge-${status}`}
    >
      <Text style={[styles.badgeText, { color: draft ? c.mutedForeground : c.secondaryForeground }]}>{label}</Text>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

export function PlanView({ plan, testID }: { plan: LearningPlan; testID?: string }) {
  const c = useColors();
  const body = [styles.body, { color: c.foreground }];
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]} testID={testID}>
      <Text style={[styles.title, { color: c.foreground }]}>{plan.title}</Text>
      <Section label="Goal"><Text style={body}>{plan.goal}</Text></Section>
      <View style={styles.facts}>
        {[
          [plan.durationWeeks, plan.durationWeeks === 1 ? 'week' : 'weeks'],
          [plan.sessionsPerWeek, 'sessions / week'],
          [plan.minutesPerSession, 'min / session'],
        ].map(([n, l]) => (
          <View key={String(l)} style={[styles.fact, { backgroundColor: c.muted, borderRadius: c.radius }]}>
            <Text style={[styles.factNum, { color: c.foreground }]}>{n}</Text>
            <Text style={[styles.factLabel, { color: c.mutedForeground }]}>{l}</Text>
          </View>
        ))}
      </View>
      <Section label="Steps">
        {plan.steps.map((s, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: c.secondary }]}>
              <Text style={[styles.stepNumText, { color: c.primary }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.stepTitle, { color: c.foreground }]}>{s.title}</Text>
              <Text style={body}>{s.description}</Text>
              <Text style={[styles.small, { color: c.mutedForeground }]}>Looks like: {s.successCriteria}</Text>
            </View>
          </View>
        ))}
      </Section>
      <Section label="Activity approach"><Text style={body}>{plan.activityApproach}</Text></Section>
      <Section label="Success criteria"><Text style={body}>{plan.successCriteria}</Text></Section>
      {plan.assumptions.length > 0 ? (
        <Section label="Assumptions">
          {plan.assumptions.map((a, i) => (
            <Text key={i} style={body}>{`\u2022  ${a}`}</Text>
          ))}
        </Section>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1 },
  badgeText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  card: { borderWidth: 1, padding: 16, gap: 16 },
  title: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  section: { gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  facts: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, padding: 10, alignItems: 'center' },
  factNum: { fontFamily: fonts.semibold, fontSize: 18 },
  factLabel: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'center' },
  step: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontFamily: fonts.semibold, fontSize: 12 },
  stepTitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
});
