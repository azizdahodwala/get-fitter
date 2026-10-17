import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tiny bar chart: one bar per session, oldest on the left, latest highlighted. */
export function ProgressBars({ points, label }: { points: { value: number; caption: string }[]; label: string }) {
  const theme = useTheme();
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <View style={{ gap: Spacing.two }}>
      <Text variant="caption">{label}</Text>
      <View style={styles.chart} accessibilityLabel={`${label} chart`}>
        {points.map((p, i) => (
          <View key={i} style={styles.col}>
            <View
              style={[
                styles.bar,
                {
                  height: `${Math.max(6, (p.value / max) * 100)}%`,
                  backgroundColor: i === points.length - 1 ? theme.accent : theme.backgroundSelected,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        <Text variant="caption">{points[0]?.caption}</Text>
        <Text variant="caption">{points[points.length - 1]?.caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 4 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: Radius.sm / 2, borderTopRightRadius: Radius.sm / 2, minHeight: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
});
