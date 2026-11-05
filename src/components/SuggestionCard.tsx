import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { IngredientLink } from '../types';
import { formatProgress } from '../core/match';
import { colors, fonts, rtl } from '../theme';
import { AppText, Button, DishAvatar, IconButton } from './ui';

export function SuggestionCard({
  link,
  note,
  loading,
  onNext,
  onAddMissing,
  onAddOne,
}: {
  link: IngredientLink;
  note?: string;
  loading?: boolean;
  onNext: () => void;
  onAddMissing: () => void;
  onAddOne: (name: string) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const ratio = link.total === 0 ? 0 : link.haveCount / link.total;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <DishAvatar name={link.recipe.name} uri={link.recipe.photoUri} size={72} />
        <View style={styles.heading}>
          <AppText style={styles.kicker}>اقتراح اليوم</AppText>
          <AppText style={styles.title}>{link.recipe.name}</AppText>
          <AppText style={styles.progress}>{formatProgress(link)}</AppText>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>

      {note ? <AppText style={styles.note}>{note}</AppText> : null}

      <AppText style={styles.section}>من ثلاجتك</AppText>
      {link.have.length === 0 ? <AppText style={styles.quiet}>لا يطابق شيئاً في الثلاجة بعد</AppText> : null}
      {link.have.map((item, index) => (
        <IngredientLine key={`have-${item.name}-${index}`} name={item.name} amount={item.amount} />
      ))}

      <AppText style={styles.section}>ناقصك</AppText>
      {link.missing.length === 0 ? <AppText style={styles.quiet}>لا ينقصك شيء</AppText> : null}
      {link.missing.map((item, index) => (
        <IngredientLine
          key={`miss-${item.name}-${index}`}
          name={item.name}
          amount={item.amount}
          action={<IconButton name="plus" label={`أضف ${item.name}`} onPress={() => onAddOne(item.name)} />}
        />
      ))}

      {link.missing.length > 0 ? (
        <Button label="أضف الناقص للمشتريات" variant="secondary" onPress={onAddMissing} disabled={loading} />
      ) : null}

      <Button label="اقتراح ثاني" onPress={onNext} disabled={loading} />

      <Pressable accessibilityRole="button" onPress={() => setStepsOpen((open) => !open)}>
        <AppText style={styles.stepsToggle}>{stepsOpen ? 'إخفاء الخطوات' : 'الخطوات'}</AppText>
      </Pressable>
      {stepsOpen
        ? link.recipe.steps.map((step, index) => (
            <AppText key={`${step}-${index}`} style={styles.step}>
              {index + 1}. {step}
            </AppText>
          ))
        : null}
    </View>
  );
}

function IngredientLine({ name, amount, action }: { name: string; amount?: string; action?: ReactNode }) {
  return (
    <View style={styles.line}>
      <View style={styles.dot} />
      <AppText style={styles.lineText}>
        {name}
        {amount ? <AppText style={styles.amount}>  {amount}</AppText> : null}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    gap: 10,
    ...rtl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...rtl,
  },
  heading: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 36,
  },
  progress: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.white,
    overflow: 'hidden',
    flexDirection: 'row',
    ...rtl,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.button,
  },
  note: {
    color: colors.muted,
    fontSize: 14,
  },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    marginTop: 8,
  },
  quiet: {
    color: colors.muted,
    fontSize: 14,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...rtl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.button,
  },
  lineText: {
    flex: 1,
    fontSize: 16,
  },
  amount: {
    color: colors.muted,
    fontSize: 14,
  },
  stepsToggle: {
    fontFamily: fonts.semibold,
    textAlign: 'center',
    marginTop: 4,
  },
  step: {
    fontSize: 15,
    lineHeight: 24,
  },
});
