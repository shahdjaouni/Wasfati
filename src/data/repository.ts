import type { AppData, Ingredient, PantryItem, Recipe, Settings } from '../types';
import { createId, defaultSettings } from '../types';
import { createSeedData } from '../core/seed';
import { mergeIntoShopping } from '../core/shopping';
import { cleanText, coerceCategory } from '../core/text';
import { clampClock } from '../core/reminder';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const STORAGE_KEY = 'tabkha.v1';

export class MemoryStorage implements KeyValueStore {
  private map = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.map.delete(key);
  }
}

type RecipeInput = {
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  photoUri?: string | null;
};

export class Repository {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private storage: KeyValueStore,
    private ids: () => string = createId,
    private now: () => string = () => new Date().toISOString(),
  ) {}

  async load(): Promise<AppData> {
    const existing = await this.read();
    if (existing) return existing;
    const seeded = createSeedData(this.ids, this.now);
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  async saveRecipe(input: RecipeInput, id?: string): Promise<AppData> {
    return this.update((data) => {
      const recipe = this.normalizeRecipe(input, id, data.recipes.find((item) => item.id === id));
      const exists = data.recipes.some((item) => item.id === recipe.id);
      const recipes = exists
        ? data.recipes.map((item) => (item.id === recipe.id ? recipe : item))
        : [recipe, ...data.recipes];
      return { ...data, recipes };
    });
  }

  async deleteRecipe(id: string): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      recipes: data.recipes.filter((recipe) => recipe.id !== id),
    }));
  }

  async addPantryItem(input: Omit<PantryItem, 'id'>): Promise<AppData> {
    const name = cleanText(input.name);
    if (!name) return this.load();
    return this.update((data) => ({
      ...data,
      pantry: [
        ...data.pantry,
        {
          id: this.ids(),
          name,
          category: coerceCategory(input.category),
          amount: input.amount ? cleanText(input.amount) : undefined,
        },
      ],
    }));
  }

  async deletePantryItem(id: string): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      pantry: data.pantry.filter((item) => item.id !== id),
    }));
  }

  async addShopping(incoming: Ingredient[]): Promise<{ data: AppData; added: number }> {
    let added = 0;
    const data = await this.update((current) => {
      const merged = mergeIntoShopping(current.shopping, incoming, this.now(), this.ids);
      added = merged.added;
      return { ...current, shopping: merged.items };
    });
    return { data, added };
  }

  async toggleShopping(id: string): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      shopping: data.shopping.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    }));
  }

  async deleteShopping(id: string): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      shopping: data.shopping.filter((item) => item.id !== id),
    }));
  }

  async clearChecked(): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      shopping: data.shopping.filter((item) => !item.checked),
    }));
  }

  async updateSettings(settings: Settings): Promise<AppData> {
    return this.update((data) => ({ ...data, settings: sanitizeSettings(settings) }));
  }

  async resetSamples(): Promise<AppData> {
    return this.update((data) => {
      const seed = createSeedData(this.ids, this.now);
      return {
        ...data,
        recipes: seed.recipes,
        pantry: seed.pantry,
      };
    });
  }

  async clearContent(): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      recipes: [],
      pantry: [],
      shopping: [],
    }));
  }

  private normalizeRecipe(input: RecipeInput, id: string | undefined, previous: Recipe | undefined): Recipe {
    const stamp = this.now();
    const ingredients = input.ingredients
      .map((ingredient) => ({
        name: cleanText(ingredient.name),
        category: coerceCategory(ingredient.category),
        amount: ingredient.amount ? cleanText(ingredient.amount) : undefined,
      }))
      .filter((ingredient) => ingredient.name);
    const steps = input.steps.map((step) => cleanText(step)).filter(Boolean);
    return {
      id: id ?? this.ids(),
      name: cleanText(input.name),
      ingredients,
      steps,
      photoUri: input.photoUri ?? null,
      createdAt: previous?.createdAt ?? stamp,
      updatedAt: stamp,
    };
  }

  private async read(): Promise<AppData | null> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      if (!parsed || parsed.initialized !== true) return null;
      return {
        recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
        pantry: Array.isArray(parsed.pantry) ? parsed.pantry : [],
        shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
        settings: sanitizeSettings(parsed.settings ?? defaultSettings()),
        initialized: true,
      };
    } catch {
      return null;
    }
  }

  private async update(change: (data: AppData) => AppData): Promise<AppData> {
    const run = this.queue.then(async () => {
      const current = (await this.read()) ?? createSeedData(this.ids, this.now);
      const next = change(current);
      await this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}

export function sanitizeSettings(settings: Settings): Settings {
  const clock = clampClock(Number(settings.reminderHour), Number(settings.reminderMinute));
  const base = typeof settings.aiBaseUrl === 'string' && settings.aiBaseUrl.trim()
    ? settings.aiBaseUrl.trim()
    : defaultSettings().aiBaseUrl;
  const model = typeof settings.aiModel === 'string' && settings.aiModel.trim()
    ? settings.aiModel.trim()
    : defaultSettings().aiModel;
  return {
    whatsappNumber: typeof settings.whatsappNumber === 'string' ? settings.whatsappNumber.trim() : '',
    reminderEnabled: Boolean(settings.reminderEnabled),
    reminderHour: clock.hour,
    reminderMinute: clock.minute,
    aiBaseUrl: base,
    aiModel: model,
  };
}
