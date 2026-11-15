import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  useApproveAdventure,
  useCompleteAdventure,
  useSendPlanningMessage,
  type Adventure,
  type PlanningMessage,
} from '@workspace/api-client-react';
import { Button, Notice, Screen, TopBar } from '@/components/ui';
import { PlanView, StatusBadge } from '@/components/AdventurePlan';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { errorText, newRequestId, subjectMeta, useAdventure, useAdventureCacheSync } from '@/lib/adventures';

const MAX = 1500;

export default function AdventureScreen() {
  const c = useColors();
  const router = useRouter();
  const { adventureId } = useLocalSearchParams<{ adventureId: string }>();
  const id = Number(adventureId);
  const { data, isLoading, isError, refetch } = useAdventure(id);

  const back = () => {
    if (router.canGoBack()) router.back();
    else if (data) router.replace({ pathname: '/children/[id]/subjects/[subject]', params: { id: String(data.childId), subject: data.subject } });
    else router.replace('/children');
  };

  if (isLoading || isError || !data) {
    return (
      <Screen testID="adventure-screen">
        <TopBar onBack={back} />
        {isLoading ? (
          <View style={styles.center} testID="adventure-loading"><ActivityIndicator color={c.primary} /></View>
        ) : (
          <View>
            <Notice tone="error" testID="adventure-error">We couldn’t open this learning adventure.</Notice>
            <Button label="Try again" variant="secondary" onPress={() => refetch()} testID="adventure-retry" />
          </View>
        )}
      </Screen>
    );
  }

  return data.status === 'draft'
    ? <PlanningChat adventure={data} onBack={back} refetch={refetch} />
    : <AdventureDetail adventure={data} onBack={back} />;
}

function Header({ adventure, onBack }: { adventure: Adventure; onBack: () => void }) {
  const c = useColors();
  return (
    <View style={styles.headWrap}>
      <TopBar
        onBack={onBack}
        titleContent={
          <Text accessibilityRole="header" numberOfLines={1} style={[styles.headTitle, { color: c.foreground }]}>
            {adventure.plan?.title ?? adventure.title}
          </Text>
        }
      />
      <View style={styles.headMeta}>
        <Text style={[styles.subject, { color: c.mutedForeground }]}>{subjectMeta(adventure.subject)?.title}</Text>
        <StatusBadge status={adventure.status} />
      </View>
    </View>
  );
}

function AdventureDetail({ adventure, onBack }: { adventure: Adventure; onBack: () => void }) {
  const c = useColors();
  const sync = useAdventureCacheSync();
  const complete = useCompleteAdventure();
  return (
    <Screen testID="adventure-screen">
      <Header adventure={adventure} onBack={onBack} />
      <View style={{ gap: 16 }}>
        {adventure.plan ? <PlanView plan={adventure.plan} testID="adventure-plan" /> : <Notice>No plan saved for this adventure.</Notice>}
        {adventure.status === 'completed' ? (
          <Notice testID="completed-note">
            {`Marked completed by a parent${adventure.completedAt ? ` on ${new Date(adventure.completedAt).toLocaleDateString()}` : ''}. This records that the adventure is finished, not a measure of mastery.`}
          </Notice>
        ) : (
          <>
            {complete.isError ? <Notice tone="error" testID="complete-error">{errorText(complete.error, 'We couldn’t mark this completed.')}</Notice> : null}
            <Text style={[styles.hint, { color: c.mutedForeground }]}>Marking completed is a parent note that the adventure is finished. It does not measure mastery.</Text>
            <Button
              label="Mark completed"
              variant="secondary"
              loading={complete.isPending}
              onPress={() => complete.mutate({ id: adventure.id }, { onSuccess: sync })}
              testID="complete-adventure-button"
            />
          </>
        )}
      </View>
    </Screen>
  );
}

function PlanningChat({ adventure, onBack, refetch }: { adventure: Adventure; onBack: () => void; refetch: () => Promise<unknown> }) {
  const c = useColors();
  const sync = useAdventureCacheSync();
  const send = useSendPlanningMessage();
  const approve = useApproveAdventure();
  const [text, setText] = useState('');
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [staleAfterError, setStaleAfterError] = useState(false);
  const lastAttempt = useRef<{ message: string; requestId: string } | null>(null);

  const submit = () => {
    const message = text.trim();
    if (!message || send.isPending || approve.isPending || message.length > MAX) return;
    const prev = lastAttempt.current;
    const requestId = prev && prev.message === message ? prev.requestId : newRequestId();
    lastAttempt.current = { message, requestId };
    setPendingText(message);
    setText('');
    send.mutate({ id: adventure.id, data: { message, requestId, revision: adventure.revision } }, {
      onSuccess: (a) => {
        lastAttempt.current = null;
        setPendingText(null);
        setStaleAfterError(false);
        sync(a);
      },
      onError: () => {
        setPendingText(null);
        setText(message);
        setStaleAfterError(true);
        refetch().then((r) => {
          if ((r as { isSuccess?: boolean }).isSuccess) setStaleAfterError(false);
        });
      },
    });
  };

  const messages: PlanningMessage[] = [...adventure.messages];
  if (pendingText) messages.push({ id: 'pending', role: 'parent', text: pendingText });
  const inverted = [...messages].reverse();

  const canApprove = !!adventure.plan && adventure.status === 'draft' && !send.isPending && !staleAfterError;

  const planBlock = (
    <View style={styles.planBlock}>
      {send.isPending ? (
        <View style={styles.thinking} testID="planning-pending">
          <ActivityIndicator color={c.primary} size="small" />
          <Text style={[styles.hint, { color: c.mutedForeground }]}>Drafting a reply…</Text>
        </View>
      ) : null}
      {send.isError ? <Notice tone="error" testID="send-error">{errorText(send.error, 'Your message wasn’t sent. Try again.')}</Notice> : null}
      {adventure.plan ? (
        <>
          <PlanView plan={adventure.plan} testID="draft-plan" />
          <Text style={[styles.hint, { color: c.mutedForeground }]}>This is a draft and is not active. Ask for changes below, or approve it to make it active.</Text>
          {approve.isError ? <Notice tone="error" testID="approve-error">{errorText(approve.error, 'We couldn’t approve this adventure.')}</Notice> : null}
          {canApprove ? (
            <Button
              label="Approve adventure"
              loading={approve.isPending}
              onPress={() => approve.mutate({ id: adventure.id, data: { revision: adventure.revision, confirmed: true } }, { onSuccess: sync })}
              testID="approve-adventure-button"
            />
          ) : null}
        </>
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} testID="adventure-screen">
      <Header adventure={adventure} onBack={onBack} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <FlatList
          inverted
          data={inverted}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
          ListHeaderComponent={planBlock}
          ListFooterComponent={
            <Text style={[styles.hint, { color: c.mutedForeground, marginBottom: 6 }]}>
              Describe what you’d like your child to work on. The assistant will draft a plan for you to review.
            </Text>
          }
          renderItem={({ item }) => {
            const parent = item.role === 'parent';
            return (
              <View
                testID={`message-${item.id}`}
                style={[
                  styles.bubble,
                  {
                    alignSelf: parent ? 'flex-end' : 'flex-start',
                    backgroundColor: parent ? c.primary : item.blocked ? c.muted : c.card,
                    borderColor: parent ? 'transparent' : c.border,
                    borderRadius: c.radius + 4,
                    opacity: item.id === 'pending' ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.bubbleText, { color: parent ? c.primaryForeground : c.foreground }]}>{item.text}</Text>
              </View>
            );
          }}
        />
        <View style={[styles.inputRow, { borderTopColor: c.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: c.card, borderColor: c.input, borderRadius: c.radius }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message the planner"
              placeholderTextColor={c.mutedForeground}
              multiline
              maxLength={MAX}
              editable={!send.isPending && !approve.isPending}
              accessibilityLabel="Planning message"
              testID="chat-input"
              style={[styles.input, { color: c.foreground }]}
            />
          </View>
          <Pressable
            onPress={submit}
            disabled={!text.trim() || send.isPending || approve.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !text.trim() || send.isPending || approve.isPending }}
            testID="chat-send"
            style={({ pressed }) => [styles.send, { backgroundColor: c.primary, opacity: !text.trim() || send.isPending || approve.isPending ? 0.45 : pressed ? 0.8 : 1 }]}
          >
            <Feather name="arrow-up" size={18} color={c.primaryForeground} />
          </Pressable>
        </View>
        {text.length > MAX - 150 ? (
          <Text style={[styles.counter, { color: c.mutedForeground }]}>{text.length}/{MAX}</Text>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 40, alignItems: 'center' },
  headWrap: { marginBottom: 8 },
  headTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 19, marginLeft: 10, letterSpacing: -0.2 },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -12, marginBottom: 8 },
  subject: { fontFamily: fonts.medium, fontSize: 13 },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  planBlock: { gap: 12, paddingTop: 4 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 10, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { flex: 1, borderWidth: 1, paddingHorizontal: 12, minHeight: 46, justifyContent: 'center' },
  input: { fontFamily: fonts.regular, fontSize: 16, maxHeight: 120, paddingVertical: 10, outlineStyle: 'none' } as never,
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  counter: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'right', marginBottom: 4 },
});
