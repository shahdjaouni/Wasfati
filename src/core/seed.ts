import { defaultGuestPlan } from '../guests/guests';
import {
  defaultSettings,
  type AppData,
  type DishKind,
  type PantryItem,
  type Recipe,
} from '../types';

export function createSeedData(ids: () => string, now: () => string): AppData {
  const stamp = now();
  const recipe = (
    name: string,
    ingredients: Recipe['ingredients'],
    steps: string[],
    details: { minutes?: number; servings?: number; kind?: DishKind; vegetarian?: boolean } = {},
  ): Recipe => ({
    id: ids(),
    name,
    ingredients,
    steps,
    photoUri: null,
    ...details,
    createdAt: stamp,
    updatedAt: stamp,
  });

  const recipes: Recipe[] = [
    recipe(
      'مقلوبة خضار',
      [
        { name: 'باذنجان', category: 'vegetables', amount: 'حبة كبيرة' },
        { name: 'بطاطا', category: 'vegetables', amount: 'حبتان' },
        { name: 'قرنبيط', category: 'vegetables', amount: 'نصف رأس' },
        { name: 'أرز', category: 'staples', amount: 'كوبان' },
        { name: 'بصل', category: 'vegetables', amount: 'حبة' },
        { name: 'زيت زيتون', category: 'staples', amount: '3 ملاعق' },
        { name: 'ملح', category: 'spices', amount: 'رشة' },
        { name: 'كمون', category: 'spices', amount: 'ملعقة صغيرة' },
      ],
      [
        'تُقلى شرائح الخضار بزيت الزيتون حتى تلين.',
        'يُوزع الأرز فوقها مع الملح والكمون.',
        'يُغطى القدر على نار هادئة حتى ينضج الأرز.',
        'تُقلب في طبق وتُقدّم.',
      ],
      { minutes: 60, servings: 4, kind: 'main', vegetarian: true },
    ),
    recipe(
      'مجدرة',
      [
        { name: 'عدس بني', category: 'staples', amount: 'كوب' },
        { name: 'أرز', category: 'staples', amount: 'كوب' },
        { name: 'بصل', category: 'vegetables', amount: 'حبتان' },
        { name: 'زيت زيتون', category: 'staples', amount: '3 ملاعق' },
        { name: 'كمون', category: 'spices', amount: 'ملعقة صغيرة' },
        { name: 'ملح', category: 'spices' },
        { name: 'فلفل أسود', category: 'spices', amount: 'رشة' },
      ],
      [
        'يُسلق العدس ثم يُضاف الأرز.',
        'يُكرمل البصل بالزيت ويُوزع على الوجه.',
        'تُضاف البهارات وتُترك المجدرة حتى تهدأ.',
      ],
      { minutes: 50, servings: 4, kind: 'main', vegetarian: true },
    ),
    recipe(
      'شوربة عدس',
      [
        { name: 'عدس أحمر', category: 'staples', amount: 'كوب' },
        { name: 'بصل', category: 'vegetables', amount: 'حبة' },
        { name: 'جزر', category: 'vegetables', amount: 'حبة' },
        { name: 'كمون', category: 'spices', amount: 'ملعقة صغيرة' },
        { name: 'ملح', category: 'spices' },
        { name: 'زيت زيتون', category: 'staples', amount: 'ملعقة' },
        { name: 'ليمون', category: 'vegetables', amount: 'نصف حبة' },
      ],
      [
        'يُقلب البصل والجزر بالزيت.',
        'يُضاف العدس والماء والكمون حتى ينضج.',
        'تُهرس الشوربة وتُقدم مع الليمون.',
      ],
      { minutes: 25, servings: 4, kind: 'soup', vegetarian: true },
    ),
    recipe(
      'شكشوكة',
      [
        { name: 'بندورة', category: 'vegetables', amount: '4 حبات' },
        { name: 'بيض', category: 'staples', amount: '3' },
        { name: 'فلفل أخضر', category: 'vegetables', amount: 'حبة' },
        { name: 'بصل', category: 'vegetables', amount: 'حبة' },
        { name: 'ملح', category: 'spices' },
        { name: 'كمون', category: 'spices' },
        { name: 'زيت زيتون', category: 'staples', amount: 'ملعقتان' },
      ],
      [
        'تُطهى البندورة مع البصل والفلفل.',
        'تُكسر البيضات في الصلصة وتُغطى حتى تنضج.',
      ],
      { minutes: 20, servings: 2, kind: 'main', vegetarian: false },
    ),
    recipe(
      'أرز بالحليب',
      [
        { name: 'أرز', category: 'staples', amount: 'نصف كوب' },
        { name: 'حليب', category: 'liquids', amount: '4 أكواب' },
        { name: 'سكر', category: 'staples', amount: '3 ملاعق' },
        { name: 'قرفة', category: 'spices', amount: 'رشة' },
      ],
      [
        'يُسلق الأرز قليلاً ثم يُضاف الحليب والسكر.',
        'يُترك على نار هادئة حتى يثقل، ويُرش بالقرفة.',
      ],
      { minutes: 40, servings: 6, kind: 'sweet', vegetarian: true },
    ),
  ];

  const pantryNames: Array<Pick<PantryItem, 'name' | 'category' | 'amount'>> = [
    { name: 'بطاطا', category: 'vegetables', amount: 'حبتان' },
    { name: 'قرنبيط', category: 'vegetables' },
    { name: 'بصل', category: 'vegetables', amount: '3 حبات' },
    { name: 'جزر', category: 'vegetables' },
    { name: 'أرز', category: 'staples', amount: 'كيلو' },
    { name: 'زيت زيتون', category: 'staples' },
    { name: 'سكر', category: 'staples' },
    { name: 'بيض', category: 'staples', amount: '6' },
    { name: 'ملح', category: 'spices' },
    { name: 'كمون', category: 'spices' },
    { name: 'حليب', category: 'liquids', amount: 'لتر' },
  ];

  const pantry: PantryItem[] = pantryNames.map((item) => ({ ...item, id: ids(), addedAt: stamp }));

  return {
    recipes,
    pantry,
    shopping: [],
    cookLog: [],
    plan: [],
    guestPlan: defaultGuestPlan(new Date(stamp)),
    settings: defaultSettings(),
    initialized: true,
  };
}
