export const CATEGORIES = ['vegetables', 'staples', 'spices', 'liquids'] as const;

export type IngredientCategory = (typeof CATEGORIES)[number];

export interface Ingredient {
  name: string;
  category: IngredientCategory;
  amount?: string;
}

export const DISH_KINDS = ['main', 'soup', 'salad', 'sweet'] as const;

export type DishKind = (typeof DISH_KINDS)[number];

export const DISH_KIND_LABELS: Record<DishKind, string> = {
  main: 'طبخة رئيسية',
  soup: 'شوربة',
  salad: 'سلطة',
  sweet: 'حلو',
};

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  photoUri?: string | null;
  /** Optional. Absent on older saved recipes until someone fills the form. */
  minutes?: number;
  servings?: number;
  kind?: DishKind;
  vegetarian?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  amount?: string;
  /** ISO time the item was added. Missing on data saved before this field existed. */
  addedAt?: string;
}

/** One cooked day. A second cook on the same date replaces the recipe and stays one check. */
export interface CookEntry {
  date: string;
  recipeId: string;
  recipeName: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: IngredientCategory;
  amount?: string;
  checked: boolean;
  createdAt: string;
}

export interface Settings {
  whatsappNumber: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  aiBaseUrl: string;
  aiModel: string;
  /**
   * How many days this week (Saturday–Friday) the cook wants to cook.
   * This is the plan frequency (مرة … يومياً) and the home caption's «من».
   * Default 3. The selected weekdays live in `planDays` and stay the same length.
   */
  weeklyGoal: number;
  /** Saturday = 0 through Friday = 6. Length matches `weeklyGoal`. */
  planDays: number[];
  /** People the week's meals are cooked for. Display only; recipe minutes stay as saved. */
  planPeople: number;
  /** Cook a double batch. Each planned day except Friday notes leftovers for the next day. */
  planDouble: boolean;
}

/** A recipe assigned to one calendar day. Other weeks stay stored. */
export interface PlanSlot {
  date: string;
  recipeId: string;
}

export const GUEST_OCCASION_IDS = ['family', 'friends', 'birthday', 'iftar'] as const;
export type GuestOccasion = (typeof GUEST_OCCASION_IDS)[number];

export const GUEST_COURSE_IDS = ['main', 'vegetarian', 'salad', 'sweet'] as const;
export type GuestCourse = (typeof GUEST_COURSE_IDS)[number];

export interface GuestNote {
  id: string;
  kind: 'vegetarians' | 'children' | 'custom';
  label: string;
  count?: number;
}

/** One saved party. Menu ids point at the user's recipes; an empty slot means that course has no saved match. */
export interface GuestPlan {
  occasion: GuestOccasion;
  date: string;
  readyHour: number;
  readyMinute: number;
  guests: number;
  notes: GuestNote[];
  menu: Partial<Record<GuestCourse, string>>;
}

export interface AppData {
  recipes: Recipe[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  settings: Settings;
  cookLog: CookEntry[];
  plan: PlanSlot[];
  guestPlan: GuestPlan;
  initialized: true;
}

export interface LinkedIngredient extends Ingredient {
  matched: boolean;
}

export interface IngredientLink {
  recipe: Recipe;
  have: LinkedIngredient[];
  missing: LinkedIngredient[];
  haveCount: number;
  total: number;
}

export interface DishSuggestion {
  recipe: Recipe;
  source: 'ai' | 'local';
  note?: string;
  /** True when every other option was already shown and the list started over. */
  wrapped?: boolean;
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetables: 'خضار',
  staples: 'مونة',
  spices: 'بهارات',
  liquids: 'سوائل',
};

export function defaultSettings(): Settings {
  return {
    whatsappNumber: '',
    reminderEnabled: false,
    reminderHour: 18,
    reminderMinute: 0,
    aiBaseUrl: 'https://api.openai.com/v1',
    aiModel: 'gpt-4o-mini',
    weeklyGoal: 3,
    planDays: [1, 3, 6],
    planPeople: 4,
    planDouble: false,
  };
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
