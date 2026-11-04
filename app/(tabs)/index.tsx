import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { suggestDish } from '../../src/ai/suggestDish';
import { SuggestionCard } from '../../src/components/SuggestionCard';
import { AppText, Button, EmptyNote, Notice, Screen, TopBar } from '../../src/components/ui';
import { linkRecipeToPantry } from '../../src/core/match';
import { useApp } from '../../src/state/AppProvider';
import type { DishSuggestion, Ingredient } from '../../src/types';
import { colors, fonts } from '../../src/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { ready, recipes, pantry, settings, apiKey, addShopping } = useApp();
  const [picked, setPicked] = useState<DishSuggestion | null>(null);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const started = useRef(false);
  const snapshot = useRef({ recipes, pantry, settings, apiKey });
  snapshot.current = { recipes, pantry, settings, apiKey };

  async function request(exclude: string[]) {
    const current = snapshot.current;
    setLoading(true);
    const suggestion = await suggestDish({
      recipes: current.recipes,
      pantry: current.pantry,
      excludeIds: exclude,
      apiKey: current.apiKey,
      baseUrl: current.settings.aiBaseUrl,
      model: current.settings.aiModel,
    });
    setPicked(suggestion);
    setExcludeIds(suggestion?.wrapped ? [] : exclude);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    void request([]);
  }, [ready]);

  const recipe = useMemo(() => {
    if (!picked) return null;
    return recipes.find((item) => item.id === picked.recipe.id) ?? picked.recipe;
  }, [picked, recipes]);

  const link = useMemo(() => (recipe ? linkRecipeToPantry(recipe, pantry) : null), [recipe, pantry]);

  async function addItems(items: Ingredient[]) {
    const added = await addShopping(items);
    setNotice(added > 0 ? `أُضيف ${added} إلى المشتريات` : 'موجود في المشتريات');
  }

  return (
    <Screen>
      <TopBar title="طبختي" onSettings={() => router.push('/settings')} />
      <AppText style={styles.question}>شو أطبخ اليوم؟</AppText>

      {!ready || (loading && !link) ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.button} />
        </View>
      ) : null}

      {notice ? <Notice>{notice}</Notice> : null}

      {link ? (
        <SuggestionCard
          link={link}
          note={picked?.note}
          loading={loading}
          onNext={() => {
            if (!picked) return;
            void request([...excludeIds, picked.recipe.id]);
          }}
          onAddMissing={() => void addItems(link.missing)}
          onAddOne={(name) => {
            const item = link.missing.find((ingredient) => ingredient.name === name);
            if (item) void addItems([item]);
          }}
        />
      ) : null}

      {ready && !loading && !link ? (
        <View style={styles.emptyCard}>
          <EmptyNote>الثلاجة فارغة. أضف مكونات أو احفظ وصفة لنقترح طبخة تناسب ما هو متوفر.</EmptyNote>
          <Button label="ثلاجتي" variant="secondary" onPress={() => router.push('/fridge')} />
          <Button label="وصفة جديدة" onPress={() => router.push('/recipe/new')} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 34,
  },
  loading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    gap: 12,
  },
});
