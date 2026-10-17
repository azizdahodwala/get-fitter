import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { Radius } from '@/constants/theme';
import type { TrackingMode } from '@/data/catalog';
import { updateSet, type SetRow, type SetValues } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirm, haptics } from '@/lib/dialogs';
import {
  formatDuration,
  formatWeight,
  parseCount,
  parseDuration,
  parseWeight,
  type Unit,
} from '@/lib/format';

export const COL = { set: 30, value: 64, check: 40 } as const;

/** Compact "20×10" / "12" / "0:30" label for the previous-session column. */
export function shortSet(s: SetValues | undefined, mode: TrackingMode, unit: Unit) {
  if (!s) return '—';
  if (mode === 'time') return s.seconds != null ? formatDuration(s.seconds) : '—';
  if (mode === 'reps' || s.weight_kg == null) return s.reps != null ? String(s.reps) : '—';
  return `${formatWeight(s.weight_kg, unit)}×${s.reps ?? '—'}`;
}

/**
 * One set: inputs for weight/reps (or time) and a check button. Empty inputs
 * show the last session's values as placeholders; checking a set with empty
 * inputs logs those placeholder values.
 */
export function SetRowView({
  set,
  index,
  mode,
  unit,
  hint,
  previous,
  onChange,
  onDelete,
  onCompleted,
}: {
  set: SetRow;
  index: number;
  mode: TrackingMode;
  unit: Unit;
  hint: SetValues | null;
  previous: SetValues | undefined;
  onChange: (s: SetRow) => void;
  onDelete: () => void;
  onCompleted: () => void;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [weight, setWeight] = useState(formatWeight(set.weight_kg, unit));
  const [reps, setReps] = useState(set.reps != null ? String(set.reps) : '');
  const [time, setTime] = useState(set.seconds != null ? formatDuration(set.seconds) : '');
  const done = !!set.done;

  function persist(values: Partial<SetRow>) {
    onChange({ ...set, ...values });
    updateSet(db, set.id, values);
  }

  function toggle() {
    if (done) {
      persist({ done: 0 });
      return;
    }
    const weight_kg = mode === 'weight' ? (parseWeight(weight, unit) ?? hint?.weight_kg ?? null) : set.weight_kg;
    const repCount = mode !== 'time' ? (parseCount(reps) ?? hint?.reps ?? null) : set.reps;
    const seconds = mode === 'time' ? (parseDuration(time) ?? hint?.seconds ?? null) : set.seconds;
    if (mode === 'time' ? !seconds : !repCount) {
      haptics.warn();
      return;
    }
    if (mode === 'weight' && !weight && weight_kg != null) setWeight(formatWeight(weight_kg, unit));
    if (mode !== 'time' && !reps && repCount != null) setReps(String(repCount));
    if (mode === 'time' && !time && seconds != null) setTime(formatDuration(seconds));
    persist({ weight_kg, reps: repCount, seconds, done: 1 });
    haptics.success();
    onCompleted();
  }

  async function askDelete() {
    if (await confirm({ title: `Delete set ${index + 1}?`, confirmText: 'Delete', destructive: true })) onDelete();
  }

  const input = [
    styles.input,
    { color: theme.text, backgroundColor: done ? 'transparent' : theme.backgroundElement },
  ];
  const placeholder = theme.textSecondary;

  return (
    <View style={[styles.row, done && { backgroundColor: theme.successSoft }]}>
      <Pressable onPress={askDelete} accessibilityLabel={`Set ${index + 1}, tap to delete`} style={{ width: COL.set }}>
        <Text variant="label" style={{ textAlign: 'center' }}>
          {index + 1}
        </Text>
      </Pressable>
      <Text variant="caption" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
        {shortSet(previous, mode, unit)}
      </Text>
      {mode === 'weight' ? (
        <TextInput
          value={weight}
          onChangeText={(t) => {
            setWeight(t);
            persist({ weight_kg: parseWeight(t, unit) });
          }}
          placeholder={hint?.weight_kg != null ? formatWeight(hint.weight_kg, unit) : unit}
          placeholderTextColor={placeholder}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={input}
          accessibilityLabel={`Set ${index + 1} weight in ${unit}`}
        />
      ) : null}
      {mode === 'time' ? (
        <TextInput
          value={time}
          onChangeText={(t) => {
            setTime(t);
            persist({ seconds: parseDuration(t) });
          }}
          placeholder={hint?.seconds != null ? formatDuration(hint.seconds) : 'sec'}
          placeholderTextColor={placeholder}
          keyboardType="numbers-and-punctuation"
          selectTextOnFocus
          style={input}
          accessibilityLabel={`Set ${index + 1} time`}
        />
      ) : (
        <TextInput
          value={reps}
          onChangeText={(t) => {
            setReps(t);
            persist({ reps: parseCount(t) });
          }}
          placeholder={hint?.reps != null ? String(hint.reps) : 'reps'}
          placeholderTextColor={placeholder}
          keyboardType="number-pad"
          selectTextOnFocus
          style={input}
          accessibilityLabel={`Set ${index + 1} reps`}
        />
      )}
      <Pressable
        onPress={toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Complete set ${index + 1}`}
        style={[styles.check, { backgroundColor: done ? theme.success : theme.backgroundElement }]}>
        <Icon name="check" size={16} color={done ? theme.onSuccess : theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: Radius.sm,
  },
  input: {
    width: COL.value,
    borderRadius: Radius.sm,
    paddingVertical: 7,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  check: {
    width: COL.check - 4,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
