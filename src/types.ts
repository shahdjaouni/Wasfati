export const CATEGORIES = ['vegetables', 'staples', 'spices', 'liquids'] as const;

export type IngredientCategory = (typeof CATEGORIES)[number];

export interface Ingredient {
  name: string;
  category: IngredientCategory;
  amount?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  photoUri?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  amount?: string;
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
}

export interface AppData {
  recipes: Recipe[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  settings: Settings;
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
  };
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
