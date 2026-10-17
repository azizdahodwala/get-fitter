import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Chip, ExerciseThumb, Icon, Text } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ALL_BODY_PARTS, displayName, filterExercises, titleCase, type Exercise } from '@/data/catalog';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/lib/settings';

const ROW_HEIGHT = 72;

/** Searchable, filterable list of the whole exercise library. */
export function ExerciseBrowser({
  header,
  onPress,
  selected,
  inTab,
}: {
  header?: ReactNode;
  onPress: (e: Exercise) => void;
  /** When given, rows show a checkmark instead of a chevron. */
  selected?: ReadonlySet<string>;
  inTab?: boolean;
}) {
  const theme = useTheme();
  const tabInset = useTabBarInset();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(true);

  const results = useMemo(
    () => filterExercises({ query, bodyPart, equipment: mineOnly ? settings.equipment : null }),
    [query, bodyPart, mineOnly, settings.equipment],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.top}>
        {header}
        <View style={[styles.search, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="search" size={16} color="textSecondary" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises, muscles, equipment"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="My equipment" selected={mineOnly} onPress={() => setMineOnly((v) => !v)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Chip label="All" selected={!bodyPart} onPress={() => setBodyPart(null)} />
          {ALL_BODY_PARTS.map((b) => (
            <Chip key={b} label={titleCase(b)} selected={bodyPart === b} onPress={() => setBodyPart(b === bodyPart ? null : b)} />
          ))}
        </ScrollView>
        <Text variant="caption">
          {results.length} exercise{results.length === 1 ? '' : 's'}
          {mineOnly ? ' with your equipment' : ''}
        </Text>
      </View>
      <FlatList
        data={results}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        initialNumToRender={14}
        windowSize={7}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        contentContainerStyle={[styles.list, inTab && { paddingBottom: tabInset + Spacing.four }]}
        renderItem={({ item }) => (
          <ExerciseRow exercise={item} onPress={() => onPress(item)} checked={selected ? selected.has(item.id) : undefined} />
        )}
        ListEmptyComponent={
          <Text variant="caption" style={{ textAlign: 'center', marginTop: Spacing.five }}>
            No exercises match. {mineOnly ? 'Try turning off “My equipment”.' : ''}
          </Text>
        }
      />
    </View>
  );
}

export function ExerciseRow({
  exercise,
  onPress,
  checked,
  right,
}: {
  exercise: Exercise;
  onPress?: () => void;
  checked?: boolean;
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <ExerciseThumb id={exercise.id} size={56} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" numberOfLines={1}>
          {displayName(exercise)}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {titleCase(exercise.target.join(', '))} · {titleCase(exercise.equipment.join(', '))}
        </Text>
      </View>
      {right ??
        (checked === undefined ? (
          <Icon name="chevronRight" size={14} color="textSecondary" />
        ) : (
          <View
            style={[
              styles.check,
              checked
                ? { backgroundColor: theme.accent, borderColor: theme.accent }
                : { borderColor: theme.border },
            ]}>
            {checked ? <Icon name="check" size={13} color={theme.onAccent} /> : null}
          </View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  chips: { gap: Spacing.two, alignItems: 'center', paddingVertical: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 22 },
  list: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  row: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

