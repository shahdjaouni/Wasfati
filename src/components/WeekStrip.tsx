import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { cookedOn, weekCaption, weekStartingSaturday, type WeekDay } from '../home/today';
import { colors, fonts, rtl } from '../theme';
import { AppText } from './ui';

export function WeekStrip({
  today,
  cookedKeys = [],
  goal,
  onPress,
}: {
  today: Date;
  cookedKeys?: readonly string[];
  goal: number;
  onPress?: () => void;
}) {
  const days = weekStartingSaturday(today);
  const cooked = cookedOn(days, cookedKeys);
  const cookedCount = cooked.filter(Boolean).length;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="خطة هالأسبوع" onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.title}>خطة هالأسبوع</AppText>
        <AppText style={styles.statusText}>{weekCaption(cookedCount, goal)}</AppText>
      </View>
      <View style={styles.days}>
        {days.map((day, index) => (
          <DayBubble key={day.key} day={day} cooked={cooked[index] === true} />
        ))}
      </View>
    </Pressable>
  );
}

function DayBubble({ day, cooked }: { day: WeekDay; cooked: boolean }) {
  return (
    <View style={styles.day}>
      <AppText style={[styles.label, day.isToday && styles.labelToday]}>{day.label}</AppText>
      <View style={[styles.bubble, cooked && styles.bubbleCooked, day.isToday && styles.bubbleToday]}>
        {cooked ? <Feather name="check" size={16} color={colors.white} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
    ...rtl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    ...rtl,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.primary,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
    ...rtl,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  labelToday: {
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  bubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleToday: {
    backgroundColor: '#FBE7C2',
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  bubbleCooked: {
    backgroundColor: colors.primary,
  },
});
