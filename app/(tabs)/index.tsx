import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { suggestDish } from '../../src/ai/suggestDish';
import { TodaySuggestion } from '../../src/components/TodaySuggestion';
import { WeekStrip } from '../../src/components/WeekStrip';
import { AppText, Button, EmptyNote, Notice, Screen } from '../../src/components/ui';
import { linkRecipeToPantry } from '../../src/core/match';
import { formatArabicDate, isFullyOnHand, recipesOnHand } from '../../src/home/today';
import { useApp } from '../../src/state/AppProvider';
import type { DishSuggestion, Ingredient } from '../../src/types';
import { colors, fonts, rtl } from '../../src/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { ready, recipes, pantry, settings, apiKey, addShopping } = useApp();
  const [picked, setPicked] = useState<DishSuggestion | null>(null);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [onlyOnHand, setOnlyOnHand] = useState(false);
  const [filteredEmpty, setFilteredEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const started = useRef(false);
  const today = useMemo(() => new Date(), []);
  const snapshot = useRef({ recipes, pantry, settings, apiKey, onlyOnHand });
  snapshot.current = { recipes, pantry, settings, apiKey, onlyOnHand };

  async function request(exclude: string[], onHand: boolean) {
    const current = snapshot.current;
    const pool = onHand ? recipesOnHand(current.recipes, current.pantry) : current.recipes;
    setLoading(true);
    if (onHand && pool.length === 0) {
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
      suggestion && (!onHand || isFullyOnHand(suggestion.recipe, current.pantry)) ? suggestion : null;
    setPicked(usable);
    setFilteredEmpty(onHand && !usable);
    setExcludeIds(usable?.wrapped ? [] : exclude);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    void request([], false);
  }, [ready]);

  const recipe = useMemo(() => {
    if (!picked) return null;
    return recipes.find((item) => item.id === picked.recipe.id) ?? picked.recipe;
  }, [picked, recipes]);

  const link = useMemo(() => (recipe ? linkRecipeToPantry(recipe, pantry) : null), [recipe, pantry]);
  const saved = Boolean(recipe && recipes.some((item) => item.id === recipe.id));

  async function addItems(items: Ingredient[]) {
    const added = await addShopping(items);
    setNotice(added > 0 ? `أُضيف ${added} إلى المشتريات` : 'موجود في المشتريات');
  }

  function toggleOnHand() {
    const next = !onlyOnHand;
    setOnlyOnHand(next);
    void request([], next);
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
          <Feather name="sliders" size={18} color={colors.text} />
        </Pressable>
      </View>

      <WeekStrip today={today} />

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
            if (recipe) router.push(`/recipe/${recipe.id}`);
          }}
          onNext={() => {
            if (!picked) return;
            void request([...excludeIds, picked.recipe.id], onlyOnHand);
          }}
          onAddMissing={() => void addItems(link.missing)}
          onAddOne={(name) => {
            const item = link.missing.find((ingredient) => ingredient.name === name);
            if (item) void addItems([item]);
          }}
        />
      ) : null}

      {filteredEmpty ? (
        <View style={styles.emptyCard}>
          <EmptyNote>ما في وصفة محفوظة كل مكوناتها موجودة بالثلاجة الآن.</EmptyNote>
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
        <AppText style={styles.filterTitle}>بدّك في معيّن؟</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: onlyOnHand }}
          onPress={toggleOnHand}
          style={[styles.filterChip, onlyOnHand && styles.filterChipOn]}
        >
          <AppText style={[styles.filterText, onlyOnHand && styles.filterTextOn]}>بس من الموجود</AppText>
        </Pressable>
        <AppText style={styles.filterNote}>
          الوقت والنوع والنباتي مش محفوظين مع الوصفة، فما منعرضهم كفلاتر.
        </AppText>
      </View>
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
    gap: 2,
  },
  date: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  question: {
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 42,
  },
  settings: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
    gap: 10,
    ...rtl,
  },
  filterTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    lineHeight: 24,
  },
  filterChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  filterTextOn: {
    color: colors.white,
  },
  filterNote: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
});
