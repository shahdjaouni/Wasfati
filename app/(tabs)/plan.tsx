import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, Notice, Screen } from '../../src/components/ui';
import { SHORT_DAYS, weekStartingSaturday } from '../../src/home/today';
import {
  FREQUENCY_CHOICES,
  applyFrequency,
  fillWeek,
  leftoverNote,
  missingPlanIngredients,
  missingPlanTitle,
  planBadge,
  planDishMeta,
  selectedDates,
  togglePlanDay,
  weekRangeLabel,
} from '../../src/plan/plan';
import { useApp } from '../../src/state/AppProvider';
import { colors, fonts, rtl } from '../../src/theme';

export default function PlanScreen() {
  const router = useRouter();
  const { ready, recipes, pantry, settings, cookLog, plan, updateSettings, assignPlan, setWeekPlan, addShopping } = useApp();
  const [notice, setNotice] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const week = useMemo(() => weekStartingSaturday(today), [today]);
  const cooked = useMemo(() => new Set(cookLog.map((entry) => entry.date)), [cookLog]);
  const dates = useMemo(() => selectedDates(today, settings.planDays), [today, settings.planDays]);
  const slots = useMemo(
    () => dates.map((date) => plan.find((slot) => slot.date === date) ?? { date, recipeId: '' }),
    [dates, plan],
  );
  const missing = useMemo(
    () =>
      missingPlanIngredients({
        slots: slots.filter((slot) => slot.recipeId),
        recipes,
        pantry,
        cookedDates: cookLog.map((entry) => entry.date),
      }),
    [slots, recipes, pantry, cookLog],
  );
  const pickingRecipe = recipes.find((recipe) => recipe.id === slots.find((slot) => slot.date === picking)?.recipeId);

  async function chooseFrequency(goal: number) {
    await updateSettings({ ...settings, ...applyFrequency(goal) });
  }

  async function chooseDay(index: number) {
    await updateSettings({ ...settings, ...togglePlanDay(settings.planDays, index) });
  }

  async function changePeople(next: number) {
    await updateSettings({ ...settings, planPeople: Math.min(12, Math.max(1, next)) });
  }

  async function fill() {
    if (recipes.length === 0) {
      setNotice('ما في وصفات محفوظة الآن لنعبّي الخطة.');
      return;
    }
    const next = fillWeek({ recipes, pantry, dates, people: settings.planPeople });
    await setWeekPlan(dates, next);
    setNotice(`تعبّت ${next.length} أيام من وصفاتك`);
  }

  async function addMissing() {
    const added = await addShopping(missing);
    setNotice(added > 0 ? `أُضيف ${added} إلى المشتريات` : 'موجود في المشتريات');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.range}>{weekRangeLabel(today)}</AppText>
        <AppText style={styles.title}>خطتي الأسبوعية</AppText>
      </View>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>كم مرة بدك تطبخي بالأسبوع؟</AppText>
        <View style={styles.freqRow}>
          {FREQUENCY_CHOICES.map((choice) => {
            const selected = settings.weeklyGoal === choice.goal;
            return (
              <Pressable
                key={choice.goal}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => void chooseFrequency(choice.goal)}
                style={[styles.freq, selected && styles.chipOn]}
              >
                <AppText style={[styles.freqText, selected && styles.chipTextOn]} numberOfLines={1}>
                  {choice.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText style={styles.dayTitle}>بأي أيام؟</AppText>
        <View style={styles.dayRow}>
          {SHORT_DAYS.map((label, index) => {
            const selected = settings.planDays.includes(index);
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => void chooseDay(index)}
                style={[styles.day, selected && styles.chipOn]}
              >
                <AppText style={[styles.dayText, selected && styles.chipTextOn]} numberOfLines={1} adjustsFontSizeToFit>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.peopleRow}>
          <AppText style={styles.cardTitle}>لكم شخص؟</AppText>
          <View style={styles.stepper}>
            <Pressable accessibilityRole="button" accessibilityLabel="أقل" onPress={() => void changePeople(settings.planPeople - 1)} style={styles.step}>
              <AppText style={styles.stepText}>−</AppText>
            </Pressable>
            <AppText style={styles.people}>{settings.planPeople}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="أكثر" onPress={() => void changePeople(settings.planPeople + 1)} style={styles.step}>
              <AppText style={styles.stepText}>+</AppText>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: settings.planDouble }}
          onPress={() => void updateSettings({ ...settings, planDouble: !settings.planDouble })}
          style={styles.double}
        >
          <View style={styles.doubleCopy}>
            <AppText style={styles.doubleTitle}>طبخة دبل</AppText>
            <AppText style={styles.doubleHelp}>اطبخي كمية تكفي يومين، والبواقي لليوم اللي بعده</AppText>
          </View>
          <View style={[styles.switchTrack, settings.planDouble ? styles.switchOn : styles.switchOff]}>
            <View style={styles.switchThumb} />
          </View>
        </Pressable>
      </View>

      <View style={styles.listBlock}>
        {notice ? <Notice>{notice}</Notice> : null}
        <View style={styles.listHead}>
          <AppText style={styles.listTitle}>طبخات الأسبوع</AppText>
          <Pressable accessibilityRole="button" onPress={() => void fill()} style={styles.fill}>
            <Feather name="star" size={15} color={colors.primaryDark} />
            <AppText style={styles.fillText}>عبّي تلقائياً</AppText>
          </Pressable>
        </View>

        {ready && recipes.length === 0 ? (
          <View style={styles.empty}>
            <AppText style={styles.emptyText}>ما في وصفات محفوظة الآن. أضيفي وصفة لنختار طبخة لكل يوم.</AppText>
            <Button label="وصفة جديدة" onPress={() => router.push('/recipe/new')} />
          </View>
        ) : (
          <View style={styles.rows}>
            {slots.map((slot) => {
              const day = week.find((item) => item.key === slot.date);
              const index = week.findIndex((item) => item.key === slot.date);
              const recipe = recipes.find((item) => item.id === slot.recipeId) ?? null;
              const badge = planBadge(Boolean(day?.isToday), cooked.has(slot.date));
              const leftover = leftoverNote(index, settings.planDouble);
              const todayTile = Boolean(day?.isToday);
              return (
                <Pressable key={slot.date} accessibilityRole="button" onPress={() => setPicking(slot.date)} style={styles.row}>
                  <View style={[styles.tile, todayTile && styles.tileToday]}>
                    <AppText style={[styles.tileText, todayTile && styles.tileTextToday]}>{SHORT_DAYS[index] ?? ''}</AppText>
                  </View>
                  <View style={styles.rowBody}>
                    <AppText style={styles.dish} numberOfLines={1}>
                      {recipe ? recipe.name : 'اختاري وصفة'}
                    </AppText>
                    {recipe ? <AppText style={styles.meta}>{planDishMeta(recipe, settings.planPeople)}</AppText> : null}
                    {recipe && leftover ? <AppText style={styles.leftover}>{leftover}</AppText> : null}
                  </View>
                  {badge === 'today' ? (
                    <View style={[styles.badge, styles.badgeToday]}>
                      <AppText style={styles.badgeTodayText}>اليوم</AppText>
                    </View>
                  ) : null}
                  {badge === 'cooked' ? (
                    <View style={[styles.badge, styles.badgeCooked]}>
                      <AppText style={styles.badgeCookedText}>طبختيها</AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {missing.length > 0 ? (
          <View style={styles.need}>
            <View style={styles.needCopy}>
              <AppText style={styles.needTitle}>{missingPlanTitle(missing.length)}</AppText>
              <AppText style={styles.needNames}>{missing.map((item) => item.name).join('، ')}</AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => void addMissing()} style={styles.add}>
              <AppText style={styles.addText}>أضيفيها</AppText>
            </Pressable>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => router.push('/guests')} style={styles.guests}>
          <View style={styles.guestIcon}>
            <Feather name="users" size={20} color="#3D2A08" />
          </View>
          <AppText style={styles.guestText}>
            <AppText style={styles.guestLead}>عندك عزومة؟ </AppText>
            خططيلها منيو كامل
          </AppText>
          <AppText style={styles.soon}>›</AppText>
        </Pressable>
      </View>

      <Modal visible={picking !== null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <AppText style={styles.sheetTitle}>اختاري طبخة</AppText>
            {pickingRecipe ? (
              <Button
                label="افتحي الوصفة"
                variant="secondary"
                onPress={() => {
                  const id = pickingRecipe.id;
                  setPicking(null);
                  router.push(`/recipe/${id}`);
                }}
              />
            ) : null}
            <ScrollView style={styles.sheetList}>
              {recipes.map((recipe) => {
                const selected = recipe.id === pickingRecipe?.id;
                return (
                  <Pressable
                    key={recipe.id}
                    accessibilityRole="button"
                    onPress={() => {
                      if (!picking) return;
                      const date = picking;
                      setPicking(null);
                      void assignPlan(date, recipe.id);
                    }}
                    style={[styles.option, selected && styles.optionOn]}
                  >
                    <AppText style={styles.optionName}>{recipe.name}</AppText>
                    {recipe.minutes != null ? <AppText style={styles.optionMeta}>{recipe.minutes} دقيقة</AppText> : null}
                  </Pressable>
                );
              })}
              {recipes.length === 0 ? <AppText style={styles.emptyText}>ما في وصفات محفوظة الآن.</AppText> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    gap: 4,
    paddingBottom: 4,
  },
  range: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 38,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    ...rtl,
  },
  freq: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  freqText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTextOn: {
    color: colors.white,
  },
  dayTitle: {
    marginTop: 20,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    ...rtl,
  },
  day: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  dayText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  peopleRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...rtl,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 4,
    ...rtl,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 24,
  },
  people: {
    minWidth: 32,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
  },
  double: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8F9F4',
    ...rtl,
  },
  doubleCopy: {
    flex: 1,
    gap: 2,
  },
  doubleTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  doubleHelp: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    ...rtl,
  },
  switchOn: {
    backgroundColor: colors.primary,
    justifyContent: 'flex-start',
  },
  switchOff: {
    backgroundColor: '#C9CFC3',
    justifyContent: 'flex-end',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  listBlock: {
    marginTop: 8,
    gap: 10,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...rtl,
  },
  listTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 28,
  },
  fill: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...rtl,
  },
  fillText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...rtl,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.softAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileToday: {
    backgroundColor: colors.saffronSoft,
  },
  tileText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryDark,
  },
  tileTextToday: {
    color: colors.saffronInk,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  dish: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  leftover: {
    marginTop: 4,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeToday: {
    backgroundColor: colors.saffronSoft,
  },
  badgeTodayText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.saffronInk,
  },
  badgeCooked: {
    backgroundColor: colors.softAlt,
  },
  badgeCookedText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryDark,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.muted,
  },
  need: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.primary,
    ...rtl,
  },
  needCopy: {
    flex: 1,
    gap: 2,
  },
  needTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
  },
  needNames: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#D6E3D0',
  },
  add: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  addText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
  },
  guests: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FBEFD9',
    ...rtl,
  },
  guestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3D49A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: '#3D2A08',
  },
  guestLead: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    color: '#3D2A08',
  },
  soon: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: '#3D2A08',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 38, 31, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 30,
  },
  sheetList: {
    maxHeight: 360,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  optionOn: {
    borderColor: colors.primary,
  },
  optionName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  optionMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
