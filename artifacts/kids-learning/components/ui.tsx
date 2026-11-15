import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import type { Option } from '@/lib/reference-data';

const isWeb = Platform.OS === 'web';

export function Screen({
  children,
  footer,
  scroll = true,
  testID,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  testID?: string;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const top = isWeb ? 67 : insets.top;
  const bottom = isWeb ? 34 : insets.bottom;
  const inner = <View style={styles.column}>{children}</View>;
  return (
    <View style={[styles.flex, { backgroundColor: c.background }]} testID={testID}>
      {scroll ? (
        <KeyboardAwareScrollViewCompat
          style={styles.flex}
          contentContainerStyle={{ paddingTop: top + 12, paddingBottom: (footer ? 16 : bottom + 24), flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </KeyboardAwareScrollViewCompat>
      ) : (
        <View style={[styles.flex, { paddingTop: top + 12, paddingBottom: footer ? 0 : bottom }]}>{inner}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: bottom + 16, borderTopColor: c.border, backgroundColor: c.background }]}>
          <View style={styles.column}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function TopBar({ onBack, right, title }: { onBack?: () => void; right?: React.ReactNode; title?: string }) {
  const c = useColors();
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="back-button"
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: c.muted, opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={18} color={c.foreground} />
        </Pressable>
      ) : (
        <View style={styles.iconSpacer} />
      )}
      {title ? <Text style={[styles.topTitle, { color: c.mutedForeground }]}>{title}</Text> : null}
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 28 }}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {children}
      </Text>
      {sub ? <Text style={[styles.sub, { color: c.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
}) {
  const c = useColors();
  const off = disabled || loading;
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.card : 'transparent';
  const fg = variant === 'primary' ? c.primaryForeground : variant === 'secondary' ? c.foreground : c.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: variant === 'secondary' ? c.input : 'transparent',
          borderRadius: c.radius,
          opacity: off ? 0.5 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !off ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  hint,
  right,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string; right?: React.ReactNode }) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: c.card,
            borderColor: error ? c.destructive : focused ? c.primary : c.input,
            borderRadius: c.radius,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={c.mutedForeground}
          accessibilityLabel={label}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, { color: c.foreground }]}
        />
        {right}
      </View>
      {error ? (
        <Text style={[styles.help, { color: c.destructive }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.help, { color: c.mutedForeground }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Notice({ tone = 'info', children, testID }: { tone?: 'info' | 'error'; children: React.ReactNode; testID?: string }) {
  const c = useColors();
  const err = tone === 'error';
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: err ? '#F4E4E1' : c.secondary, borderRadius: c.radius }]}
    >
      <Feather name={err ? 'alert-circle' : 'info'} size={16} color={err ? c.destructive : c.secondaryForeground} style={{ marginTop: 2 }} />
      <Text style={[styles.noticeText, { color: err ? c.destructive : c.secondaryForeground }]}>{children}</Text>
    </View>
  );
}

export function Divider({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: c.border }]} />
      <Text style={[styles.dividerText, { color: c.mutedForeground }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: c.border }]} />
    </View>
  );
}

export function SelectField({
  label,
  placeholder,
  value,
  display,
  options,
  onChange,
  error,
  searchPlaceholder,
  testID,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  display: string | null;
  options: Option[];
  onChange: (v: string) => void;
  error?: string | null;
  searchPlaceholder: string;
  testID?: string;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(s) ||
        (o.hint ?? '').toLowerCase().includes(s) ||
        o.value.toLowerCase() === s,
    );
  }, [q, options]);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display ?? 'not selected'}`}
        style={({ pressed }) => [
          styles.inputWrap,
          styles.select,
          { backgroundColor: c.card, borderColor: error ? c.destructive : c.input, borderRadius: c.radius, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text style={[styles.selectText, { color: display ? c.foreground : c.mutedForeground }]} numberOfLines={1}>
          {display ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={c.mutedForeground} />
      </Pressable>
      {error ? <Text style={[styles.help, { color: c.destructive }]}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheetBackdrop, { backgroundColor: c.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Close" />
          <View
            style={[
              styles.sheet,
              { backgroundColor: c.background, paddingBottom: (isWeb ? 34 : insets.bottom) + 8, marginTop: (isWeb ? 67 : insets.top) + 24 },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: c.input }]} />
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: c.foreground }]}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" testID={`${testID}-close`}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.inputWrap, styles.search, { backgroundColor: c.card, borderColor: c.input, borderRadius: c.radius }]}>
              <Feather name="search" size={16} color={c.mutedForeground} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={searchPlaceholder}
                placeholderTextColor={c.mutedForeground}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus={!isWeb}
                accessibilityLabel={searchPlaceholder}
                testID={`${testID}-search`}
                style={[styles.input, { color: c.foreground }]}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: c.mutedForeground }]}>Nothing matches “{q}”.</Text>
              }
              renderItem={({ item }) => {
                const sel = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    testID={`${testID}-option-${item.value}`}
                    style={({ pressed }) => [
                      styles.option,
                      { backgroundColor: sel ? c.secondary : pressed ? c.muted : 'transparent', borderRadius: c.radius - 4 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionText, { color: c.foreground }]}>{item.label}</Text>
                      {item.hint ? <Text style={[styles.optionHint, { color: c.mutedForeground }]}>{item.hint}</Text> : null}
                    </View>
                    {sel ? <Feather name="check" size={18} color={c.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24, flexGrow: 1 },
  footer: { paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, minHeight: 40 },
  topTitle: { fontFamily: fonts.medium, fontSize: 14, letterSpacing: 0.3 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 40, height: 40 },
  title: { fontFamily: fonts.semibold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  sub: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginTop: 10 },
  button: { minHeight: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 0.1 },
  field: { marginBottom: 18 },
  label: { fontFamily: fonts.medium, fontSize: 14, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, minHeight: 52 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 14, outlineStyle: 'none' } as never,
  help: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6, lineHeight: 18 },
  notice: { flexDirection: 'row', gap: 10, padding: 14, marginBottom: 18 },
  noticeText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontFamily: fonts.regular, fontSize: 13 },
  select: { justifyContent: 'space-between' },
  selectText: { flex: 1, fontFamily: fonts.regular, fontSize: 16 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, width: '100%', maxWidth: 560, alignSelf: 'center' },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetTitle: { fontFamily: fonts.semibold, fontSize: 18 },
  search: { gap: 8, marginBottom: 10 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12 },
  optionText: { fontFamily: fonts.medium, fontSize: 16 },
  optionHint: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  empty: { fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', paddingVertical: 32 },
});
