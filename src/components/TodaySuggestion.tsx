import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { availabilityLabel, ingredientCountLabel, missingLabel, suggestionBadge } from '../home/today';
import type { IngredientLink } from '../types';
import { colors, fonts, rtl } from '../theme';
import { DishArt } from './DishArt';
import { AppText, Button } from './ui';

export function TodaySuggestion({
  link,
  note,
  loading,
  saved,
  onCook,
  onNext,
  onAddMissing,
  onAddOne,
}: {
  link: IngredientLink;
  note?: string;
  loading?: boolean;
  saved: boolean;
  onCook: () => void;
  onNext: () => void;
  onAddMissing: () => void;
  onAddOne: (name: string) => void;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const ratio = link.total === 0 ? 0 : link.haveCount / link.total;

  return (
    <View style={styles.card}>
      <DishArt badge={suggestionBadge(link.haveCount)} />
      <View style={styles.body}>
        <AppText style={styles.name}>{link.recipe.name}</AppText>
        {link.total > 0 ? <AppText style={styles.meta}>{ingredientCountLabel(link.total)}</AppText> : null}
        {note ? <AppText style={styles.note}>{note}</AppText> : null}

        <View style={styles.progressRow}>
          <AppText style={styles.progress}>{availabilityLabel(link.haveCount, link.total)}</AppText>
          {link.missing.length > 0 ? (
            <AppText style={styles.missing}>{missingLabel(link.missing.length)}</AppText>
          ) : null}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
        </View>

        <View style={styles.chips}>
          {link.have.map((item, index) => (
            <View key={`have-${item.name}-${index}`} style={[styles.chip, styles.chipHave]}>
              <Feather name="check" size={13} color={colors.primary} />
              <AppText style={styles.chipHaveText}>{item.name}</AppText>
            </View>
          ))}
          {link.missing.map((item, index) => (
            <Pressable
              key={`miss-${item.name}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`أضيفي ${item.name} للمشتريات`}
              onPress={() => onAddOne(item.name)}
              style={[styles.chip, styles.chipMiss]}
            >
              <Feather name="plus" size={13} color={colors.saffronInk} />
              <AppText style={styles.chipMissText}>{item.name}</AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <View style={styles.actionMain}>
            <Button
              label={saved ? 'يلا نطبخها' : stepsOpen ? 'إخفاء الخطوات' : 'الخطوات'}
              onPress={saved ? onCook : () => setStepsOpen((open) => !open)}
              disabled={loading}
            />
          </View>
          <View style={styles.actionNext}>
            <Button label="اقتراح ثاني" variant="secondary" onPress={onNext} disabled={loading} />
          </View>
        </View>

        {stepsOpen
          ? link.recipe.steps.map((step, index) => (
              <AppText key={`${step}-${index}`} style={styles.step}>
                {index + 1}. {step}
              </AppText>
            ))
          : null}

        {link.missing.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={onAddMissing} hitSlop={6}>
            <AppText style={styles.link}>أضيفي النواقص للمشتريات</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...rtl,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
    ...rtl,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 36,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
    ...rtl,
  },
  progress: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  missing: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    color: colors.saffronInk,
  },
  track: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.softAlt,
    overflow: 'hidden',
    flexDirection: 'row',
    ...rtl,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    ...rtl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...rtl,
  },
  chipHave: {
    backgroundColor: colors.soft,
  },
  chipMiss: {
    backgroundColor: colors.saffronSoft,
  },
  chipHaveText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  chipMissText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.saffronInk,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    ...rtl,
  },
  actionMain: {
    flex: 1.35,
  },
  actionNext: {
    flex: 1,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  step: {
    fontSize: 14,
    lineHeight: 22,
  },
});
