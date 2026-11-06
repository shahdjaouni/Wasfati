import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { cookedOn, weekStartingSaturday, weekStatusLabel, type WeekDay } from '../home/today';
import { colors, fonts, rtl } from '../theme';
import { AppText } from './ui';

export function WeekStrip({ today, cookedKeys = [] }: { today: Date; cookedKeys?: readonly string[] }) {
  const days = weekStartingSaturday(today);
  const cooked = cookedOn(days, cookedKeys);
  const cookedCount = cookedKeys.length === 0 ? null : cooked.filter(Boolean).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.title}>خطة هالأسبوع</AppText>
        <View style={styles.status}>
          <Feather name="calendar" size={14} color={colors.muted} />
          <AppText style={styles.statusText}>{weekStatusLabel(cookedCount)}</AppText>
        </View>
      </View>
      <View style={styles.days}>
        {days.map((day, index) => (
          <DayBubble key={day.key} day={day} cooked={cooked[index] === true} />
        ))}
      </View>
    </View>
  );
}

function DayBubble({ day, cooked }: { day: WeekDay; cooked: boolean }) {
  return (
    <View style={styles.day}>
      <View
        style={[
          styles.bubble,
          cooked && styles.bubbleCooked,
          day.isToday && !cooked && styles.bubbleToday,
        ]}
      >
        {cooked ? <Feather name="check" size={14} color={colors.white} /> : null}
      </View>
      <AppText style={[styles.label, day.isToday && styles.labelToday]}>{day.label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
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
    fontFamily: fonts.heading,
    fontSize: 16,
    lineHeight: 24,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...rtl,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...rtl,
  },
  day: {
    alignItems: 'center',
    gap: 6,
    width: 36,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.softAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleToday: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  bubbleCooked: {
    backgroundColor: colors.primary,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  labelToday: {
    color: colors.saffronInk,
    fontFamily: fonts.semibold,
  },
});
