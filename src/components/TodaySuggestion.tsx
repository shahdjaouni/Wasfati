import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { availabilityLabel, missingLabel, recipeMetaLine, suggestionBadge } from '../home/today';
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
  const meta = recipeMetaLine(link.recipe);

  return (
    <View style={styles.card}>
      <DishArt badge={suggestionBadge(link.haveCount)} />
      <View style={styles.body}>
        <AppText style={styles.name}>{link.recipe.name}</AppText>
        {meta ? <AppText style={styles.meta}>{meta}</AppText> : null}
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
              <Feather name="check" size={13} color={colors.primaryDark} />
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="اقتراح ثاني"
            disabled={loading}
            onPress={onNext}
            style={[styles.next, loading && styles.nextDisabled]}
          >
            <Feather name="refresh-cw" size={18} color={colors.text} />
            <AppText style={styles.nextLabel}>اقتراح ثاني</AppText>
          </Pressable>
        </View>

        {stepsOpen
          ? link.recipe.steps.map((step, index) => (
              <AppText key={`${step}-${index}`} style={styles.step}>
                {index + 1}. {step}
              </AppText>
            ))
          : null}

        {link.missing.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={onAddMissing} hitSlop={6} style={styles.linkHit}>
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
    padding: 18,
    gap: 0,
    ...rtl,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 32,
  },
  meta: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  note: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  progressRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    ...rtl,
  },
  progress: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  missing: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: '#8A5A12',
  },
  track: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1E3C8',
    overflow: 'hidden',
    flexDirection: 'row',
    ...rtl,
  },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
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
    backgroundColor: '#E6EDE2',
  },
  chipMiss: {
    backgroundColor: '#FBE7C2',
  },
  chipHaveText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  chipMissText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.saffronInk,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    alignItems: 'stretch',
    ...rtl,
  },
  actionMain: {
    flex: 1,
  },
  next: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...rtl,
  },
  nextDisabled: {
    opacity: 0.45,
  },
  nextLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  linkHit: {
    minHeight: 44,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  step: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
  },
});
