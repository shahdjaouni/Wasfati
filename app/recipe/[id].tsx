import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, CategoryChips, DishAvatar, Field, IconButton, Notice, Screen } from '../../src/components/ui';
import { useApp } from '../../src/state/AppProvider';
import { createId, type Ingredient, type IngredientCategory, type Recipe } from '../../src/types';
import { colors, fonts } from '../../src/theme';

interface DraftIngredient {
  key: string;
  name: string;
  amount: string;
  category: IngredientCategory;
}

interface DraftStep {
  key: string;
  text: string;
}

export default function RecipeScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { ready, recipes } = useApp();
  const existing = recipes.find((recipe) => recipe.id === recipeId);

  if (!ready) {
    return (
      <Screen>
        <AppText>لحظات...</AppText>
      </Screen>
    );
  }

  if (recipeId !== 'new' && !existing) {
    return <MissingRecipe />;
  }

  return <RecipeForm recipeId={recipeId} existing={existing} />;
}

function MissingRecipe() {
  const router = useRouter();
  return (
    <Screen>
      <Button label="رجوع" variant="quiet" onPress={() => router.back()} />
      <AppText>لم نجد هذه الوصفة.</AppText>
    </Screen>
  );
}

function RecipeForm({ recipeId, existing }: { recipeId: string; existing?: Recipe }) {
  const router = useRouter();
  const { saveRecipe, deleteRecipe } = useApp();
  const isNew = recipeId === 'new';
  const [name, setName] = useState(existing?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? null);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    existing?.ingredients.map(toDraft) ?? [draftIngredient()],
  );
  const [steps, setSteps] = useState<DraftStep[]>(
    existing && existing.steps.length > 0 ? existing.steps.map((text) => ({ key: createId(), text })) : [draftStep()],
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function updateIngredient(key: string, patch: Partial<DraftIngredient>) {
    setIngredients((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function pick(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice(fromCamera ? 'لم يُمنح إذن الكاميرا' : 'لم يُمنح إذن الصور');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.35,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.35,
          base64: true,
        });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset?.base64 && asset.base64.length > 450_000) {
      setNotice('الصورة كبيرة. جرّب صورة أصغر');
      return;
    }
    if (!asset) return;
    setPhotoUri(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
  }

  async function save() {
    const cleanedIngredients = ingredients
      .map((ingredient) => ({
        name: ingredient.name,
        amount: ingredient.amount,
        category: ingredient.category,
      }))
      .filter((ingredient) => ingredient.name.trim());
    const cleanedSteps = steps.map((step) => step.text).filter((step) => step.trim());
    if (!name.trim()) {
      setNotice('اكتب اسم الوصفة');
      return;
    }
    if (cleanedIngredients.length === 0) {
      setNotice('أضف مكوناً واحداً على الأقل');
      return;
    }
    if (cleanedSteps.length === 0) {
      setNotice('أضف خطوة واحدة على الأقل');
      return;
    }
    await saveRecipe(
      { name, ingredients: cleanedIngredients, steps: cleanedSteps, photoUri },
      isNew ? undefined : existing?.id,
    );
    router.back();
  }

  return (
    <Screen>
      <Button label="رجوع" variant="quiet" onPress={() => router.back()} />
      <AppText style={styles.title}>{isNew ? 'وصفة جديدة' : 'تعديل الوصفة'}</AppText>

      <View style={styles.photoRow}>
        <DishAvatar name={name || 'ط'} uri={photoUri} size={72} />
        <View style={styles.photoActions}>
          <Button label="صورة" variant="secondary" onPress={() => void pick(false)} />
          <Button label="كاميرا" variant="secondary" onPress={() => void pick(true)} />
        </View>
      </View>
      {photoUri ? <Button label="إزالة الصورة" variant="quiet" onPress={() => setPhotoUri(null)} /> : null}

      <Field label="الاسم" value={name} onChangeText={setName} placeholder="مجدرة" />

      <AppText style={styles.section}>المكونات</AppText>
      {ingredients.map((ingredient) => (
        <View key={ingredient.key} style={styles.block}>
          <View style={styles.inline}>
            <View style={styles.grow}>
              <Field
                value={ingredient.name}
                onChangeText={(value) => updateIngredient(ingredient.key, { name: value })}
                placeholder="المكون"
              />
            </View>
            <IconButton
              name="trash-2"
              label="حذف المكون"
              onPress={() => setIngredients((rows) => rows.filter((row) => row.key !== ingredient.key))}
            />
          </View>
          <Field
            value={ingredient.amount}
            onChangeText={(value) => updateIngredient(ingredient.key, { amount: value })}
            placeholder="الكمية"
          />
          <CategoryChips
            value={ingredient.category}
            onChange={(category) => updateIngredient(ingredient.key, { category })}
          />
        </View>
      ))}
      <Button label="مكون جديد" variant="secondary" onPress={() => setIngredients((rows) => [...rows, draftIngredient()])} />

      <AppText style={styles.section}>الخطوات</AppText>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.inline}>
          <View style={styles.grow}>
            <Field
              value={step.text}
              onChangeText={(value) =>
                setSteps((rows) => rows.map((row) => (row.key === step.key ? { ...row, text: value } : row)))
              }
              placeholder={`خطوة ${index + 1}`}
            />
          </View>
          <IconButton
            name="trash-2"
            label="حذف الخطوة"
            onPress={() => setSteps((rows) => rows.filter((row) => row.key !== step.key))}
          />
        </View>
      ))}
      <Button label="خطوة جديدة" variant="secondary" onPress={() => setSteps((rows) => [...rows, draftStep()])} />

      {notice ? <Notice>{notice}</Notice> : null}
      <Button label="حفظ الوصفة" onPress={() => void save()} />
      {!isNew && existing ? (
        confirmDelete ? (
          <Button
            label="تأكيد الحذف"
            variant="quiet"
            onPress={() => {
              void deleteRecipe(existing.id);
              router.back();
            }}
          />
        ) : (
          <Button label="حذف الوصفة" variant="quiet" onPress={() => setConfirmDelete(true)} />
        )
      ) : null}
    </Screen>
  );
}

function toDraft(ingredient: Ingredient): DraftIngredient {
  return {
    key: createId(),
    name: ingredient.name,
    amount: ingredient.amount ?? '',
    category: ingredient.category,
  };
}

function draftIngredient(): DraftIngredient {
  return { key: createId(), name: '', amount: '', category: 'vegetables' };
}

function draftStep(): DraftStep {
  return { key: createId(), text: '' };
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 40,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  block: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    gap: 8,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
});
