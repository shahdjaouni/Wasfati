import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, DishAvatar, Screen, TopBar } from '../../src/components/ui';
import { useApp } from '../../src/state/AppProvider';
import { colors, fonts, rtl } from '../../src/theme';

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes } = useApp();

  return (
    <Screen>
      <TopBar title="وصفاتي" onSettings={() => router.push('/settings')} />
      <Button label="وصفة جديدة" onPress={() => router.push('/recipe/new')} />
      {recipes.length === 0 ? <AppText style={styles.empty}>لا وصفات محفوظة بعد.</AppText> : null}
      {recipes.map((recipe) => (
        <Pressable
          key={recipe.id}
          accessibilityRole="button"
          onPress={() => router.push(`/recipe/${recipe.id}`)}
          style={styles.row}
        >
          <DishAvatar name={recipe.name} uri={recipe.photoUri} />
          <View style={styles.copy}>
            <AppText style={styles.name}>{recipe.name}</AppText>
            <AppText style={styles.meta}>{recipe.ingredients.length} مكونات</AppText>
          </View>
          <Feather name="chevron-left" size={18} color={colors.faint} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...rtl,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
  },
  empty: {
    color: colors.muted,
  },
});
