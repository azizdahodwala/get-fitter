import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextProps as RNTextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { getExercise } from '@/data/catalog';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';

// ---------- Icons ----------

const ICONS = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  up: { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' },
  down: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  video: { ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display' },
  timer: { ios: 'timer', android: 'timer', web: 'timer' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  share: { ios: 'square.and.arrow.up', android: 'ios_share', web: 'ios_share' },
  download: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  trophy: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' },
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  dumbbell: { ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' },
  library: { ios: 'figure.strengthtraining.traditional', android: 'sports_gymnastics', web: 'sports_gymnastics' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  swap: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
} satisfies Record<string, Extract<SymbolViewProps['name'], object>>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18, color }: { name: IconName; size?: number; color?: ThemeColor | string }) {
  const theme = useTheme();
  const tint = color ? ((theme as Record<string, string>)[color] ?? color) : theme.text;
  return <SymbolView name={ICONS[name]} size={size} tintColor={tint} />;
}

// ---------- Text ----------

type Variant = 'largeTitle' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'number';

export function Text({
  variant = 'body',
  color,
  style,
  ...rest
}: RNTextProps & { variant?: Variant; color?: ThemeColor }) {
  const theme = useTheme();
  const fallback: ThemeColor = variant === 'caption' ? 'textSecondary' : 'text';
  return <RNText style={[{ color: theme[color ?? fallback] }, textStyles[variant], style]} {...rest} />;
}

const textStyles = StyleSheet.create({
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  number: { fontSize: 22, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

// ---------- Layout ----------

/** Scrollable page with the app background, gutters and a centred max width. */
export function Screen({
  children,
  tab,
  contentStyle,
  ...rest
}: ScrollViewProps & { tab?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.screen,
        tab && { paddingTop: insets.top + Spacing.three, paddingBottom: tabInset + Spacing.five },
        contentStyle,
      ]}
      {...rest}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}>{children}</View>
  );
}

export function Row({ children, gap = Spacing.two, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: Spacing.four, marginBottom: Spacing.two }}>
      <Text variant="heading">{title}</Text>
      {action}
    </Row>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={36} color="textSecondary" />
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text variant="caption" style={{ textAlign: 'center', maxWidth: 300 }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

// ---------- Controls ----------

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  icon,
  kind = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  icon?: IconName;
  kind?: ButtonKind;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const palette: Record<ButtonKind, { bg: string; fg: string }> = {
    primary: { bg: theme.accent, fg: theme.onAccent },
    secondary: { bg: theme.backgroundElement, fg: theme.text },
    ghost: { bg: 'transparent', fg: theme.accent },
    danger: { bg: 'transparent', fg: theme.danger },
  };
  const { bg, fg } = palette[kind];
  const pad = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, paddingVertical: pad, paddingHorizontal: size === 'sm' ? 12 : 18 },
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.75 },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 17} color={fg} /> : null}
          {title ? (
            <RNText style={[styles.buttonText, { color: fg, fontSize: size === 'lg' ? 17 : size === 'sm' ? 14 : 16 }]}>
              {title}
            </RNText>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  label,
  size = 18,
}: {
  icon: IconName;
  onPress: () => void;
  color?: ThemeColor;
  label: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}>
      <Icon name={icon} size={size} color={color ?? 'textSecondary'} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.card,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      <RNText style={[styles.chipText, { color: selected ? theme.onAccent : theme.text }]}>{label}</RNText>
    </Pressable>
  );
}

/** Static label pill, e.g. muscle or equipment tags. */
export function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' }) {
  const theme = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: tone === 'accent' ? theme.accentSoft : theme.backgroundElement }]}>
      <RNText style={[styles.tagText, { color: tone === 'accent' ? theme.accent : theme.textSecondary }]}>{label}</RNText>
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: theme.card }]}>
            <RNText style={[styles.segmentText, { color: active ? theme.text : theme.textSecondary }]}>{o.label}</RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Exercise media ----------

/**
 * The ExerciseDB animation. GIFs have a white background, so they always sit on
 * a white tile. `animate` is off in lists to keep scrolling smooth.
 */
export function ExerciseThumb({ id, size = 56, animate = false }: { id: string; size?: number; animate?: boolean }) {
  const ex = getExercise(id);
  return (
    <View style={[styles.thumb, { width: size, height: size, borderRadius: size > 100 ? Radius.lg : Radius.sm }]}>
      {ex ? (
        <Image
          source={{ uri: ex.gif }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          autoplay={animate}
          recyclingKey={id}
          cachePolicy="disk"
          transition={120}
          accessibilityLabel={`${ex.name} demonstration`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
  },
  buttonText: { fontWeight: '700' },
  iconButton: { padding: 6, borderRadius: Radius.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  tagText: { fontSize: 13, fontWeight: '600' },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.sm },
  segmentText: { fontSize: 14, fontWeight: '600' },
  thumb: { backgroundColor: '#FFFFFF', overflow: 'hidden' },
});
