import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { suggestDish } from '../../src/ai/suggestDish';
import { TodaySuggestion } from '../../src/components/TodaySuggestion';
import { WeekStrip } from '../../src/components/WeekStrip';
import { AppText, Button, EmptyNote, Notice, Screen } from '../../src/components/ui';
import { linkRecipeToPantry } from '../../src/core/match';
import {
  dayKey,
  findUseSoon,
  formatArabicDate,
  recipeMatchesFilter,
  recipesForFilter,
  useSoonMessage,
  type HomeFilter,
} from '../../src/home/today';
import { plannedRecipeForToday } from '../../src/plan/plan';
import { useApp } from '../../src/state/AppProvider';
import type { DishSuggestion, Ingredient } from '../../src/types';
import { colors, fonts, rtl } from '../../src/theme';

const FILTERS: { id: HomeFilter; label: string }[] = [
  { id: 'quick', label: 'سريعة، أقل من 30 د' },
  { id: 'onHand', label: 'بس من الموجود' },
  { id: 'vegetarian', label: 'نباتية' },
  { id: 'sweet', label: 'حلو' },
];

const EMPTY_FILTER: Record<HomeFilter, string> = {
  quick: 'ما في وصفة محفوظة بأقل من 30 دقيقة الآن.',
  onHand: 'ما في وصفة محفوظة كل مكوناتها موجودة بالثلاجة الآن.',
  vegetarian: 'ما في وصفة نباتية محفوظة الآن.',
  sweet: 'ما في حلو محفوظ الآن.',
};

export default function TodayScreen() {
  const router = useRouter();
  const { ready, recipes, pantry, settings, apiKey, cookLog, plan, addShopping, markCooked } = useApp();
  const [picked, setPicked] = useState<DishSuggestion | null>(null);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<HomeFilter | null>(null);
  const [filteredEmpty, setFilteredEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const started = useRef(false);
  const today = useMemo(() => new Date(), []);
  const todayPlanId = plan.find((slot) => slot.date === dayKey(today))?.recipeId ?? '';
  const snapshot = useRef({ recipes, pantry, settings, apiKey, filter, plan });
  snapshot.current = { recipes, pantry, settings, apiKey, filter, plan };

  async function request(exclude: string[], active: HomeFilter | null) {
    const current = snapshot.current;
    const pool = recipesForFilter(current.recipes, current.pantry, active);
    setLoading(true);
    const planned = plannedRecipeForToday(pool, current.plan, dayKey(today), current.pantry, null);
    if (planned && exclude.length === 0) {
      setPicked({ recipe: planned, source: 'local', note: 'من خطتك لهاليوم' });
      setFilteredEmpty(false);
      setExcludeIds([]);
      setLoading(false);
      return;
    }
    if (active && pool.length === 0) {
      setPicked(null);
      setFilteredEmpty(true);
      setExcludeIds(exclude);
      setLoading(false);
      return;
    }

    const suggestion = await suggestDish({
      recipes: pool,
      pantry: current.pantry,
      excludeIds: exclude,
      apiKey: current.apiKey,
      baseUrl: current.settings.aiBaseUrl,
      model: current.settings.aiModel,
    });
    const usable =
      suggestion && (!active || recipeMatchesFilter(suggestion.recipe, current.pantry, active)) ? suggestion : null;
    setPicked(usable);
    setFilteredEmpty(Boolean(active) && !usable);
    setExcludeIds(usable?.wrapped ? [] : exclude);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    if (!started.current) {
      started.current = true;
      void request([], null);
      return;
    }
    void request([], snapshot.current.filter);
  }, [ready, todayPlanId]);

  const recipe = useMemo(() => {
    if (!picked) return null;
    return recipes.find((item) => item.id === picked.recipe.id) ?? picked.recipe;
  }, [picked, recipes]);

  const link = useMemo(() => (recipe ? linkRecipeToPantry(recipe, pantry) : null), [recipe, pantry]);
  const saved = Boolean(recipe && recipes.some((item) => item.id === recipe.id));
  const soon = useMemo(() => findUseSoon(pantry, recipes, today), [pantry, recipes, today]);

  async function addItems(items: Ingredient[]) {
    const added = await addShopping(items);
    setNotice(added > 0 ? `أُضيف ${added} إلى المشتريات` : 'موجود في المشتريات');
  }

  function toggleFilter(next: HomeFilter) {
    const active = filter === next ? null : next;
    setFilter(active);
    void request([], active);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.heading}>
          <AppText style={styles.date}>{formatArabicDate(today)}</AppText>
          <AppText style={styles.question}>شو نطبخ اليوم؟</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="الإعدادات"
          onPress={() => router.push('/settings')}
          hitSlop={10}
          style={styles.settings}
        >
          <Feather name="sliders" size={22} color={colors.text} />
        </Pressable>
      </View>

      <WeekStrip
        today={today}
        cookedKeys={cookLog.map((entry) => entry.date)}
        goal={settings.weeklyGoal}
        onPress={() => router.push('/plan')}
      />

      {notice ? <Notice>{notice}</Notice> : null}

      {!ready || (loading && !link) ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {link ? (
        <TodaySuggestion
          link={link}
          note={picked?.note}
          loading={loading}
          saved={saved}
          onCook={() => {
            if (!recipe) return;
            void markCooked(recipe.id, recipe.name);
            router.push(`/recipe/${recipe.id}`);
          }}
          onNext={() => {
            if (!picked) return;
            void request([...excludeIds, picked.recipe.id], filter);
          }}
          onAddMissing={() => void addItems(link.missing)}
          onAddOne={(name) => {
            const item = link.missing.find((ingredient) => ingredient.name === name);
            if (item) void addItems([item]);
          }}
        />
      ) : null}

      {filteredEmpty && filter ? (
        <View style={styles.emptyCard}>
          <EmptyNote>{EMPTY_FILTER[filter]}</EmptyNote>
        </View>
      ) : null}

      {ready && !loading && !link && !filteredEmpty ? (
        <View style={styles.emptyCard}>
          <EmptyNote>الثلاجة فارغة. أضيفي مكونات أو احفظي وصفة لنقترح طبخة تناسب الموجود.</EmptyNote>
          <Button label="ثلاجتي" variant="secondary" onPress={() => router.push('/fridge')} />
          <Button label="وصفة جديدة" onPress={() => router.push('/recipe/new')} />
        </View>
      ) : null}

      <View style={styles.filters}>
        <AppText style={styles.filterTitle}>بدّك شي معيّن؟</AppText>
        <View style={styles.filterRow}>
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleFilter(item.id)}
                style={[styles.filterChip, selected && styles.filterChipOn]}
              >
                <AppText style={[styles.filterText, selected && styles.filterTextOn]}>{item.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {soon ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(soon.recipe ? `/recipe/${soon.recipe.id}` : '/fridge')}
          style={styles.banner}
        >
          <View style={styles.bannerIcon}>
            <Feather name="clock" size={20} color="#3D2A08" />
          </View>
          <AppText style={styles.bannerText}>
            <AppText style={styles.bannerLead}>استعمليه قريباً: </AppText>
            {useSoonMessage(soon).replace(/^استعمليه قريباً:\s*/, '')}
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    ...rtl,
  },
  heading: {
    flex: 1,
    gap: 4,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  question: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 38,
  },
  settings: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  filters: {
    marginTop: 6,
    gap: 10,
    ...rtl,
  },
  filterTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    ...rtl,
  },
  filterChip: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  filterChipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  filterTextOn: {
    color: colors.white,
    fontFamily: fonts.semibold,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FBEFD9',
    ...rtl,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3D49A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: '#3D2A08',
  },
  bannerLead: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 22,
    color: '#3D2A08',
  },
});
