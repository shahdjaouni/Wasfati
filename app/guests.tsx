import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Notice } from '../src/components/ui';
import {
  GUEST_COURSES,
  GUEST_OCCASIONS,
  courseNote,
  coursePool,
  formatReadyTime,
  guestMissingNames,
  guestMissingTitle,
  guestShoppingItems,
  prepSchedule,
  resolveMenu,
  swapCourse,
  vegetariansLabel,
} from '../src/guests/guests';
import { formatArabicDate } from '../src/home/today';
import { dateFromKey, peopleLabel } from '../src/plan/plan';
import { useApp } from '../src/state/AppProvider';
import { colors, fonts, paragraph, rtl } from '../src/theme';
import { createId, type GuestCourse, type GuestPlan } from '../src/types';

const TIMES: { hour: number; minute: number }[] = [];
for (let hour = 8; hour <= 22; hour += 1) {
  TIMES.push({ hour, minute: 0 });
  if (hour < 22) TIMES.push({ hour, minute: 30 });
}

export default function GuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, recipes, pantry, guestPlan, saveGuestPlan, assignPlan, addShopping } = useApp();
  const [draft, setDraft] = useState<GuestPlan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picking, setPicking] = useState<'date' | 'time' | null>(null);
  const [custom, setCustom] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (!ready || seeded.current) return;
    seeded.current = true;
    const menu = resolveMenu(guestPlan.menu, recipes, pantry);
    const next = { ...guestPlan, menu };
    setDraft(next);
    if (JSON.stringify(menu) !== JSON.stringify(guestPlan.menu)) void saveGuestPlan(next);
  }, [ready, guestPlan, recipes, pantry, saveGuestPlan]);

  const event = draft ? dateFromKey(draft.date) : new Date();
  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 21 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return date;
    });
  }, []);

  async function commit(next: GuestPlan) {
    setDraft(next);
    await saveGuestPlan(next);
  }

  if (!draft) {
    return <View style={[styles.screen, rtl]} />;
  }
  const plan = draft;

  const vegetarian = plan.notes.find((note) => note.kind === 'vegetarians');
  const children = plan.notes.some((note) => note.kind === 'children');
  const customs = plan.notes.filter((note) => note.kind === 'custom');
  const missing = guestShoppingItems(recipes, plan.menu, pantry, plan.guests);
  const mainRecipe = recipes.find((recipe) => recipe.id === plan.menu.main);
  const steps = prepSchedule({
    event,
    readyHour: plan.readyHour,
    readyMinute: plan.readyMinute,
    mainMinutes: mainRecipe?.minutes,
    hasSides: Boolean(plan.menu.salad),
    hasMissing: missing.length > 0,
  });

  function toggleVegetarians() {
    const count = vegetarian?.count ?? 0;
    const nextCount = count >= Math.min(plan.guests, 12) ? 0 : count + 1;
    const notes = plan.notes.filter((note) => note.kind !== 'vegetarians');
    if (nextCount > 0) {
      notes.unshift({ id: 'vegetarians', kind: 'vegetarians', label: vegetariansLabel(nextCount), count: nextCount });
    }
    void commit({ ...plan, notes });
  }

  function toggleChildren() {
    const notes = children
      ? plan.notes.filter((note) => note.kind !== 'children')
      : [...plan.notes, { id: 'children', kind: 'children' as const, label: 'أطفال' }];
    void commit({ ...plan, notes });
  }

  function addCustom() {
    const label = custom.trim();
    if (!label) return;
    void commit({
      ...plan,
      notes: [...plan.notes, { id: createId(), kind: 'custom', label }],
    });
    setCustom('');
    setAddingNote(false);
  }

  function swap(course: GuestCourse) {
    const pool = coursePool(recipes, course);
    if (pool.length < 2) {
      setNotice(pool.length === 0 ? 'ما في وصفة محفوظة من هالنوع.' : 'ما في خيار ثاني من هالنوع.');
      return;
    }
    void commit({ ...plan, menu: swapCourse(plan.menu, recipes, pantry, course) });
  }

  async function addToPlan() {
    if (!plan.menu.main) {
      setNotice('ما في طبخة رئيسية محفوظة لتضاف للخطة.');
      return;
    }
    await assignPlan(plan.date, plan.menu.main);
    setNotice('انضافت الطبخة الرئيسية لخطتك');
    router.push('/plan');
  }

  async function addToShopping() {
    const added = await addShopping(missing);
    setNotice(added > 0 ? `أُضيف ${added} إلى المشتريات` : 'موجود في المشتريات');
  }

  return (
    <View style={[styles.screen, rtl]}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable accessibilityRole="button" onPress={() => router.push('/plan')} style={styles.back}>
          <Feather name="chevron-right" size={20} color={colors.text} />
          <AppText style={styles.backLabel}>الخطة</AppText>
        </Pressable>
        <AppText style={styles.title}>عزومة</AppText>
        <AppText style={styles.lead}>قوليلنا عن العزومة، ومنرتّبلك المنيو والتحضير والمشتريات.</AppText>

        {notice ? <View style={styles.notice}><Notice>{notice}</Notice></View> : null}

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>المناسبة</AppText>
          <View style={styles.chips}>
            {GUEST_OCCASIONS.map((item) => {
              const selected = plan.occasion === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => void commit({ ...plan, occasion: item.id })}
                  style={[styles.occasion, selected && styles.occasionOn]}
                >
                  <AppText style={[styles.occasionText, selected && styles.occasionTextOn]}>{item.label}</AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.when}>
            <Pressable accessibilityRole="button" onPress={() => setPicking('date')} style={styles.whenCell}>
              <AppText style={styles.whenLabel}>اليوم</AppText>
              <AppText style={styles.whenValue}>{formatArabicDate(event)}</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setPicking('time')} style={styles.whenCell}>
              <AppText style={styles.whenLabel}>الأكل جاهز</AppText>
              <AppText style={styles.whenValue}>{formatReadyTime(plan.readyHour, plan.readyMinute)}</AppText>
            </Pressable>
          </View>

          <View style={styles.peopleRow}>
            <AppText style={styles.cardTitle}>عدد الضيوف</AppText>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="أقل"
                onPress={() => void commit({ ...plan, guests: Math.max(2, plan.guests - 1) })}
                style={styles.step}
              >
                <AppText style={styles.stepText}>−</AppText>
              </Pressable>
              <AppText style={styles.people}>{plan.guests}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="أكثر"
                onPress={() => void commit({ ...plan, guests: Math.min(40, plan.guests + 1) })}
                style={styles.step}
              >
                <AppText style={styles.stepText}>+</AppText>
              </Pressable>
            </View>
          </View>

          <AppText style={styles.noteTitle}>لازم ننتبه لـ</AppText>
          <View style={styles.chips}>
            <Pressable accessibilityRole="button" onPress={toggleVegetarians} style={[styles.diet, vegetarian && styles.dietOn]}>
              <AppText style={[styles.dietText, vegetarian && styles.dietTextOn]}>
                {vegetarian ? vegetariansLabel(vegetarian.count ?? 1) : 'نباتيين'}
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={toggleChildren} style={[styles.diet, children && styles.dietOn]}>
              <AppText style={[styles.dietText, children && styles.dietTextOn]}>أطفال</AppText>
            </Pressable>
            {customs.map((note) => (
              <Pressable
                key={note.id}
                accessibilityRole="button"
                onPress={() => void commit({ ...plan, notes: plan.notes.filter((item) => item.id !== note.id) })}
                style={[styles.diet, styles.dietOn]}
              >
                <AppText style={[styles.dietText, styles.dietTextOn]}>{note.label}</AppText>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setAddingNote(true)} style={styles.addNote}>
              <AppText style={styles.addNoteText}>+ أضيفي</AppText>
            </Pressable>
          </View>
          {addingNote ? (
            <View style={styles.customRow}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="ملاحظة، مثل بدون مكسرات"
                placeholderTextColor={colors.faint}
                style={styles.customInput}
                onSubmitEditing={addCustom}
              />
              <Pressable accessibilityRole="button" onPress={addCustom} style={styles.customAdd}>
                <AppText style={styles.customAddText}>أضيفي</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHead}>
          <AppText style={styles.sectionTitle}>المنيو المقترح</AppText>
          <View style={styles.forPeople}>
            <Feather name="star" size={13} color={colors.primaryDark} />
            <AppText style={styles.forPeopleText}>لـ{peopleLabel(plan.guests)}</AppText>
          </View>
        </View>
        <View style={styles.menu}>
          {GUEST_COURSES.map((course, index) => {
            const recipe = recipes.find((item) => item.id === plan.menu[course.id]) ?? null;
            const note = courseNote(recipe, pantry);
            return (
              <View key={course.id} style={[styles.menuRow, index < GUEST_COURSES.length - 1 && styles.menuLine]}>
                <View style={[styles.tile, { backgroundColor: course.tile }]} />
                <View style={styles.menuBody}>
                  <AppText style={styles.course}>{course.label}</AppText>
                  <AppText style={styles.dish} numberOfLines={1}>{recipe ? recipe.name : 'بدون وصفة'}</AppText>
                  <AppText style={[styles.courseNote, note.full ? styles.noteFull : styles.noteMiss]}>{note.text}</AppText>
                </View>
                <Pressable accessibilityRole="button" onPress={() => swap(course.id)} style={styles.swap}>
                  <Feather name="refresh-cw" size={15} color={colors.text} />
                  <AppText style={styles.swapText}>غيّري</AppText>
                </Pressable>
              </View>
            );
          })}
        </View>

        <AppText style={styles.prepTitle}>جدول التحضير</AppText>
        <View style={styles.prep}>
          {steps.map((step) => (
            <View key={`${step.label}-${step.detail}`} style={styles.prepRow}>
              <View style={[styles.dot, step.tone === 'shop' ? styles.dotShop : step.tone === 'serve' ? styles.dotServe : styles.dotWork]} />
              <View style={styles.prepCopy}>
                <AppText style={styles.prepWhen}>{step.label}</AppText>
                <AppText style={styles.prepDetail}>{step.detail}</AppText>
              </View>
            </View>
          ))}
        </View>

        {missing.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void addToShopping()} style={styles.missing}>
            <View style={styles.missingCopy}>
              <AppText style={styles.missingTitle}>{guestMissingTitle(missing.length)}</AppText>
              <AppText style={styles.missingNames}>{guestMissingNames(missing)}</AppText>
            </View>
            <AppText style={styles.missingChevron}>›</AppText>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable accessibilityRole="button" onPress={() => void addToPlan()} style={styles.primary}>
          <AppText style={styles.primaryText}>أضيفيها للخطة</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void addToShopping()} style={styles.secondary}>
          <AppText style={styles.secondaryText}>للمشتريات</AppText>
        </Pressable>
      </View>

      <Modal visible={picking !== null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <AppText style={styles.sheetTitle}>{picking === 'date' ? 'اليوم' : 'الأكل جاهز'}</AppText>
            <ScrollView style={styles.sheetList}>
              {picking === 'date'
                ? days.map((date) => (
                    <Pressable
                      key={date.toISOString()}
                      accessibilityRole="button"
                      onPress={() => {
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        void commit({ ...plan, date: `${date.getFullYear()}-${month}-${day}` });
                        setPicking(null);
                      }}
                      style={styles.option}
                    >
                      <AppText style={styles.optionText}>{formatArabicDate(date)}</AppText>
                    </Pressable>
                  ))
                : TIMES.map((time) => (
                    <Pressable
                      key={`${time.hour}-${time.minute}`}
                      accessibilityRole="button"
                      onPress={() => {
                        void commit({ ...plan, readyHour: time.hour, readyMinute: time.minute });
                        setPicking(null);
                      }}
                      style={styles.option}
                    >
                      <AppText style={styles.optionText}>{formatReadyTime(time.hour, time.minute)}</AppText>
                    </Pressable>
                  ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    paddingHorizontal: 20,
  },
  back: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    ...rtl,
  },
  backLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    marginTop: 6,
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 38,
  },
  lead: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  notice: {
    marginTop: 12,
  },
  card: {
    marginTop: 16,
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    ...rtl,
  },
  occasion: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occasionOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  occasionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  occasionTextOn: {
    color: colors.white,
  },
  when: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    ...rtl,
  },
  whenCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  whenLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  whenValue: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  peopleRow: {
    marginTop: 16,
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
  noteTitle: {
    marginTop: 16,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  diet: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietOn: {
    backgroundColor: '#FBE7C2',
    borderColor: '#FBE7C2',
  },
  dietText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  dietTextOn: {
    color: colors.saffronInk,
  },
  addNote: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A9B6A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  customRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    ...rtl,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    ...paragraph,
  },
  customAdd: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },
  sectionHead: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...rtl,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 28,
  },
  forPeople: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...rtl,
  },
  forPeopleText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryDark,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingStart: 10,
    paddingEnd: 14,
    ...rtl,
  },
  menuLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0E8',
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  menuBody: {
    flex: 1,
    minWidth: 0,
  },
  course: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  dish: {
    marginTop: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  courseNote: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  noteFull: {
    color: colors.primaryDark,
  },
  noteMiss: {
    color: '#8A5A12',
  },
  swap: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...rtl,
  },
  swapText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  prepTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 28,
  },
  prep: {
    gap: 0,
  },
  prepRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    ...rtl,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
  },
  dotShop: { backgroundColor: '#D9902A' },
  dotWork: { backgroundColor: colors.primary },
  dotServe: { backgroundColor: '#E8B35C' },
  prepCopy: {
    flex: 1,
  },
  prepWhen: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  prepDetail: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  missing: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FBEFD9',
    ...rtl,
  },
  missingCopy: {
    flex: 1,
    gap: 2,
  },
  missingTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: '#3D2A08',
  },
  missingNames: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: '#3D2A08',
  },
  missingChevron: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#3D2A08',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...rtl,
  },
  primary: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
  },
  secondary: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
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
  optionText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
});
