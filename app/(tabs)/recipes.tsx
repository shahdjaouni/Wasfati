import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { PlateMark } from '../../src/recipes/PlateMark';
import {
  RECIPE_FILTERS,
  coverageBadge,
  plateColors,
  recipeCardMeta,
  recipeMatchesListFilter,
  recipeMatchesQuery,
  savedRecipeCount,
  type RecipeListFilter,
} from '../../src/recipes/recipes';
import { AppText, Notice, Screen } from '../../src/components/ui';
import { useApp } from '../../src/state/AppProvider';
import { colors, fonts, paragraph, rtl } from '../../src/theme';

const badgeSide: ViewStyle = Platform.OS === 'web' ? { right: 8 } : { start: 8 };

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, pantry } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RecipeListFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      recipes.filter(
        (recipe) => recipeMatchesQuery(recipe, query) && recipeMatchesListFilter(recipe, pantry, filter),
      ),
    [recipes, pantry, query, filter],
  );

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText style={styles.count}>{savedRecipeCount(recipes.length)}</AppText>
            <AppText style={styles.title}>وصفاتي</AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/recipe/new')} style={styles.add}>
            <Feather name="plus" size={16} color={colors.white} />
            <AppText style={styles.addText}>وصفة جديدة</AppText>
          </Pressable>
        </View>

        <View style={styles.search}>
          <Feather name="search" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحثي باسم الطبخة أو مكوّن…"
            placeholderTextColor={colors.muted}
            accessibilityLabel="ابحثي بالوصفات"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filters}>
          {RECIPE_FILTERS.map((item) => {
            const selected = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.id)}
                style={[styles.filter, selected && styles.filterOn]}
              >
                <AppText style={[styles.filterText, selected && styles.filterTextOn]}>{item.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        {shown.length === 0 ? (
          <AppText style={styles.empty}>
            {recipes.length === 0 ? 'ما في وصفات محفوظة الآن.' : 'ما في وصفة بهالبحث.'}
          </AppText>
        ) : (
          <View style={styles.grid}>
            {shown.map((recipe) => {
              const plate = plateColors(recipe.id);
              const badge = coverageBadge(recipe, pantry);
              const meta = recipeCardMeta(recipe);
              return (
                <View key={recipe.id} style={styles.cell}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    style={styles.card}
                  >
                    <View style={[styles.art, { backgroundColor: plate.tile }]}>
                      {recipe.photoUri ? (
                        <Image source={{ uri: recipe.photoUri }} style={styles.photo} />
                      ) : (
                        <PlateMark colors={plate} />
                      )}
                      {badge ? (
                        <View style={[styles.badge, badgeSide, badge.full ? styles.badgeFull : styles.badgeMiss]}>
                          <AppText style={[styles.badgeText, badge.full ? styles.badgeTextFull : styles.badgeTextMiss]}>
                            {badge.label}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.body}>
                      <AppText style={styles.name} numberOfLines={1}>
                        {recipe.name}
                      </AppText>
                      {meta ? <AppText style={styles.meta}>{meta}</AppText> : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {notice ? (
          <View style={styles.notice}>
            <Notice>{notice}</Notice>
          </View>
        ) : null}

        <View style={styles.imports}>
          <Pressable accessibilityRole="button" onPress={() => setNotice('قريباً')} style={styles.import}>
            <AppText style={styles.importText}>استيراد من رابط</AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setNotice('قريباً')} style={styles.import}>
            <AppText style={styles.importText}>من صورة وصفة</AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    ...rtl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    ...rtl,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  count: {
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
  add: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...rtl,
  },
  addText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  search: {
    marginTop: 16,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...rtl,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    ...paragraph,
  },
  filters: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    ...rtl,
  },
  filter: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOn: {
    backgroundColor: '#1C261F',
    borderColor: '#1C261F',
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  filterTextOn: {
    color: colors.white,
  },
  empty: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  grid: {
    marginTop: 16,
    marginHorizontal: -6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...rtl,
  },
  cell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  art: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeFull: {
    backgroundColor: colors.white,
  },
  badgeMiss: {
    backgroundColor: '#FBE7C2',
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
  },
  badgeTextFull: {
    color: colors.primaryDark,
  },
  badgeTextMiss: {
    color: colors.saffronInk,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  notice: {
    marginTop: 4,
  },
  imports: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 8,
    ...rtl,
  },
  import: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A9B6A3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  importText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
