import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Notice } from '../../src/components/ui';
import { formatArabicDate, weekStartingSaturday } from '../../src/home/today';
import { peopleLabel, togglePlanDay } from '../../src/plan/plan';
import { PlateMark } from '../../src/recipes/PlateMark';
import { categoryTone, nextCategory, plateColors } from '../../src/recipes/recipes';
import { useApp } from '../../src/state/AppProvider';
import { colors, fonts, paragraph, rtl } from '../../src/theme';
import {
  createId,
  DISH_KINDS,
  type DishKind,
  type Ingredient,
  type IngredientCategory,
  type Recipe,
} from '../../src/types';

const KIND_SHORT: Record<DishKind, string> = {
  main: 'رئيسية',
  soup: 'شوربة',
  salad: 'سلطة',
  sweet: 'حلو',
};

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
      <View style={[styles.screen, rtl]}>
        <AppText>لحظات...</AppText>
      </View>
    );
  }

  if (recipeId !== 'new' && !existing) return <MissingRecipe />;
  return <RecipeForm existing={existing} />;
}

function MissingRecipe() {
  const router = useRouter();
  return (
    <View style={[styles.screen, rtl, styles.missing]}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Feather name="chevron-right" size={20} color={colors.text} />
        <AppText style={styles.backLabel}>وصفاتي</AppText>
      </Pressable>
      <AppText>لم نجد هذه الوصفة.</AppText>
    </View>
  );
}

function RecipeForm({ existing }: { existing?: Recipe }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveRecipe, deleteRecipe, assignPlan, settings, updateSettings } = useApp();
  const id = useRef(existing?.id ?? createId()).current;
  const [name, setName] = useState(existing?.name ?? '');
  const [minutes, setMinutes] = useState(existing?.minutes ? String(existing.minutes) : '');
  const [servings, setServings] = useState(existing?.servings ? String(existing.servings) : '');
  const [kind, setKind] = useState<DishKind | null>(existing?.kind ?? null);
  const [vegetarian, setVegetarian] = useState(existing?.vegetarian === true);
  const [favorite, setFavorite] = useState(existing?.favorite === true);
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? null);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    existing?.ingredients.map(toDraft) ?? [draftIngredient()],
  );
  const [steps, setSteps] = useState<DraftStep[]>(existing?.steps.map((text) => ({ key: createId(), text })) ?? []);
  const [notice, setNotice] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [editingServings, setEditingServings] = useState(false);
  const week = weekStartingSaturday(new Date());
  const plate = plateColors(id);
  const namedCount = ingredients.filter((row) => row.name.trim()).length;

  function updateIngredient(key: string, patch: Partial<DraftIngredient>) {
    setIngredients((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function validated() {
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
      return null;
    }
    if (cleanedIngredients.length === 0) {
      setNotice('أضف مكوناً واحداً على الأقل');
      return null;
    }
    if (cleanedSteps.length === 0) {
      setNotice('أضف خطوة واحدة على الأقل');
      return null;
    }
    const parsedMinutes = optionalNumber(minutes);
    const parsedServings = optionalNumber(servings);
    if (minutes.trim() && parsedMinutes == null) {
      setNotice('الدقائق رقم صحيح، أو اتركيها فارغة');
      return null;
    }
    if (servings.trim() && parsedServings == null) {
      setNotice('عدد الأشخاص رقم صحيح، أو اتركيه فارغاً');
      return null;
    }
    return {
      name,
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
      photoUri,
      minutes: parsedMinutes,
      servings: parsedServings,
      kind,
      vegetarian,
      favorite,
    };
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
    const input = validated();
    if (!input) return;
    await saveRecipe(input, id);
    router.back();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert('حذف الوصفة', 'بدك تحذفي هالوصفة؟ ما في رجوع.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          void deleteRecipe(existing.id);
          router.replace('/recipes');
        },
      },
    ]);
  }

  async function addToPlan(date: string) {
    const input = validated();
    if (!input) {
      setPicking(false);
      return;
    }
    await saveRecipe(input, id);
    await assignPlan(date, id, true);
    const index = week.findIndex((day) => day.key === date);
    if (index >= 0 && !settings.planDays.includes(index)) {
      await updateSettings({ ...settings, ...togglePlanDay(settings.planDays, index) });
    }
    setPicking(false);
    router.replace('/plan');
  }

  function cycleKind() {
    if (!kind) {
      setKind('main');
      return;
    }
    const index = DISH_KINDS.indexOf(kind);
    setKind(DISH_KINDS[(index + 1) % DISH_KINDS.length]);
  }

  return (
    <View style={[styles.screen, rtl]}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
            <Feather name="chevron-right" size={20} color={colors.text} />
            <AppText style={styles.backLabel}>وصفاتي</AppText>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: favorite }}
              accessibilityLabel="المفضلة"
              onPress={() => setFavorite((value) => !value)}
              style={styles.heart}
            >
              <Feather name="heart" size={18} color={favorite ? '#9A3412' : colors.text} />
            </Pressable>
            {existing ? (
              <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.delete}>
                <AppText style={styles.deleteText}>حذف الوصفة</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={[styles.photo, { backgroundColor: plate.tile }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.plate}>
              <PlateMark colors={plate} size={120} />
            </View>
          )}
          {photoUri ? (
            <Pressable accessibilityRole="button" accessibilityLabel="إزالة الصورة" onPress={() => setPhotoUri(null)} style={styles.clearPhoto}>
              <Feather name="x" size={16} color={colors.text} />
            </Pressable>
          ) : null}
          <View style={styles.photoActions}>
            <Pressable accessibilityRole="button" onPress={() => void pick(true)} style={styles.photoButton}>
              <Feather name="camera" size={16} color={colors.text} />
              <AppText style={styles.photoButtonText}>كاميرا</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void pick(false)} style={styles.photoButton}>
              <Feather name="image" size={16} color={colors.text} />
              <AppText style={styles.photoButtonText}>من الصور</AppText>
            </Pressable>
          </View>
        </View>

        <AppText style={styles.fieldLabel}>اسم الوصفة</AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="اسم الطبخة"
          placeholderTextColor={colors.faint}
          style={styles.nameInput}
        />

        <View style={styles.facts}>
          <View style={styles.fact}>
            <AppText style={styles.factLabel}>الوقت</AppText>
            <View style={styles.factValue}>
              <TextInput
                value={minutes}
                onChangeText={(value) => setMinutes(value.replace(/[^\d]/g, '').slice(0, 3))}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={colors.faint}
                style={styles.factInput}
              />
              {minutes ? <AppText style={styles.factSuffix}>د</AppText> : null}
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setEditingServings(true)} style={styles.fact}>
            <AppText style={styles.factLabel}>بتكفي</AppText>
            {editingServings ? (
              <TextInput
                value={servings}
                onChangeText={(value) => setServings(value.replace(/[^\d]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                autoFocus
                placeholder="—"
                placeholderTextColor={colors.faint}
                onBlur={() => setEditingServings(false)}
                style={styles.factInput}
              />
            ) : (
              <AppText style={styles.factText}>{servings ? peopleLabel(Number(servings)) : '—'}</AppText>
            )}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={cycleKind} style={styles.fact}>
            <AppText style={styles.factLabel}>النوع</AppText>
            <AppText style={styles.factText}>{kind ? KIND_SHORT[kind] : '—'}</AppText>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: vegetarian }}
          onPress={() => setVegetarian((value) => !value)}
          style={styles.veg}
        >
          <AppText style={styles.vegText}>نباتية</AppText>
          <View style={[styles.vegMark, vegetarian && styles.vegMarkOn]}>
            {vegetarian ? <Feather name="check" size={14} color={colors.white} /> : null}
          </View>
        </Pressable>

        {notice ? (
          <View style={styles.notice}>
            <Notice>{notice}</Notice>
          </View>
        ) : null}

        <View style={styles.sectionHead}>
          <AppText style={styles.sectionTitle}>المكونات</AppText>
          <AppText style={styles.sectionCount}>{namedCount} مكونات</AppText>
        </View>
        <View style={styles.ingredientCard}>
          {ingredients.map((ingredient) => {
            const tone = categoryTone(ingredient.category);
            return (
              <View key={ingredient.key} style={styles.ingredientRow}>
                <TextInput
                  value={ingredient.name}
                  onChangeText={(value) => updateIngredient(ingredient.key, { name: value })}
                  placeholder="المكوّن"
                  placeholderTextColor={colors.faint}
                  accessibilityLabel="المكوّن"
                  style={[styles.ingredientInput, styles.ingredientName]}
                />
                <TextInput
                  value={ingredient.amount}
                  onChangeText={(value) => updateIngredient(ingredient.key, { amount: value })}
                  placeholder="الكمية"
                  placeholderTextColor={colors.faint}
                  accessibilityLabel="الكمية"
                  style={[styles.ingredientInput, styles.ingredientQty]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تصنيف المكوّن"
                  onPress={() => updateIngredient(ingredient.key, { category: nextCategory(ingredient.category) })}
                  style={[styles.cat, { backgroundColor: tone.bg }]}
                >
                  <AppText style={[styles.catText, { color: tone.fg }]}>{tone.label}</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="احذفي المكوّن"
                  onPress={() => setIngredients((rows) => rows.filter((row) => row.key !== ingredient.key))}
                  style={styles.remove}
                >
                  <Feather name="x" size={18} color={colors.muted} />
                </Pressable>
              </View>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={() => setIngredients((rows) => [...rows, draftIngredient()])}
            style={styles.addRow}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <AppText style={styles.addRowText}>مكوّن جديد</AppText>
          </Pressable>
        </View>
        <AppText style={styles.hint}>اضغطي على التصنيف لتغييره: خضار، مونة، بهارات، سوائل.</AppText>

        <AppText style={[styles.sectionTitle, styles.stepsTitle]}>الطريقة</AppText>
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <View key={step.key} style={styles.step}>
              <View style={styles.stepNo}>
                <AppText style={styles.stepNoText}>{index + 1}</AppText>
              </View>
              <TextInput
                value={step.text}
                onChangeText={(value) =>
                  setSteps((rows) => rows.map((row) => (row.key === step.key ? { ...row, text: value } : row)))
                }
                placeholder="الخطوة"
                placeholderTextColor={colors.faint}
                multiline
                style={styles.stepInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="احذفي الخطوة"
                onPress={() => setSteps((rows) => rows.filter((row) => row.key !== step.key))}
                style={styles.remove}
              >
                <Feather name="x" size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => setSteps((rows) => [...rows, draftStep()])}
            style={styles.addStep}
          >
            <View style={styles.addStepNo}>
              <AppText style={styles.addStepNoText}>{steps.length + 1}</AppText>
            </View>
            <AppText style={styles.addStepText}>أضيفي خطوة…</AppText>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable accessibilityRole="button" onPress={() => void save()} style={styles.primary}>
          <AppText style={styles.primaryText}>حفظ الوصفة</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setPicking(true)} style={styles.secondary}>
          <AppText style={styles.secondaryText}>أضيفيها للخطة</AppText>
        </Pressable>
      </View>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <AppText style={styles.sheetTitle}>اختاري اليوم</AppText>
            {week.map((day) => (
              <Pressable key={day.key} accessibilityRole="button" onPress={() => void addToPlan(day.key)} style={styles.option}>
                <AppText style={styles.optionText}>{day.isToday ? `اليوم، ${formatArabicDate(dateFromWeekKey(day.key))}` : formatArabicDate(dateFromWeekKey(day.key))}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function dateFromWeekKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 999) return null;
  return parsed;
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
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  missing: {
    padding: 20,
  },
  page: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...rtl,
  },
  back: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...rtl,
  },
  backLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    ...rtl,
  },
  heart: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: {
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: '#9A3412',
  },
  photo: {
    marginTop: 8,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 14,
  },
  photoImage: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
  },
  plate: {
    position: 'absolute',
    top: 18,
  },
  clearPhoto: {
    position: 'absolute',
    top: 12,
    start: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    ...rtl,
  },
  photoButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...rtl,
  },
  photoButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    marginTop: 18,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  nameInput: {
    marginTop: 6,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE1D6',
    backgroundColor: colors.white,
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.text,
    ...paragraph,
  },
  facts: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    ...rtl,
  },
  fact: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DDE1D6',
  },
  factLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  factValue: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    ...rtl,
  },
  factInput: {
    minWidth: 18,
    padding: 0,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    ...paragraph,
  },
  factSuffix: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  factText: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  veg: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...rtl,
  },
  vegText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  vegMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#CBD5C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegMarkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  notice: {
    marginTop: 12,
  },
  sectionHead: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    ...rtl,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 28,
  },
  sectionCount: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  ingredientCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingStart: 10,
    paddingEnd: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0E8',
    ...rtl,
  },
  ingredientInput: {
    height: 44,
    minWidth: 0,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    ...paragraph,
  },
  ingredientName: {
    flexGrow: 1.2,
    flexShrink: 1,
    flexBasis: 0,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  ingredientQty: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  cat: {
    flexShrink: 0,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  remove: {
    flexShrink: 0,
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...rtl,
  },
  addRowText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primary,
  },
  hint: {
    marginTop: 8,
    marginHorizontal: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  stepsTitle: {
    marginTop: 24,
    marginBottom: 10,
  },
  steps: {
    gap: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...rtl,
  },
  stepNo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNoText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
  },
  stepInput: {
    flex: 1,
    minHeight: 28,
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    ...paragraph,
  },
  addStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A9B6A3',
    ...rtl,
  },
  addStepNo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#7E8C79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepNoText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    color: '#4A554C',
  },
  addStepText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  footer: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: 'rgba(28, 38, 31, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    padding: 16,
    paddingBottom: 28,
    ...rtl,
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 8,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
