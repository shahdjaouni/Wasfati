import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { AppData, Ingredient, PantryItem, Settings } from '../types';
import { defaultSettings } from '../types';
import { deviceStorage } from '../data/asyncStorage';
import { readApiKey, writeApiKey } from '../data/secureKey';
import { Repository } from '../data/repository';

type RecipeInput = {
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  photoUri?: string | null;
};

interface AppState {
  ready: boolean;
  recipes: AppData['recipes'];
  pantry: PantryItem[];
  shopping: AppData['shopping'];
  settings: Settings;
  apiKey: string | null;
  saveRecipe: (input: RecipeInput, id?: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addPantryItem: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  deletePantryItem: (id: string) => Promise<void>;
  addShopping: (items: Ingredient[]) => Promise<number>;
  toggleShopping: (id: string) => Promise<void>;
  deleteShopping: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  saveSettings: (settings: Settings, apiKey: string) => Promise<void>;
  resetSamples: () => Promise<void>;
  clearContent: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);
const repository = new Repository(deviceStorage);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([repository.load(), readApiKey()])
      .then(([loaded, key]) => {
        if (!active) return;
        setData(loaded);
        setApiKey(key);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      recipes: data?.recipes ?? [],
      pantry: data?.pantry ?? [],
      shopping: data?.shopping ?? [],
      settings: data?.settings ?? defaultSettings(),
      apiKey,
      async saveRecipe(input, id) {
        setData(await repository.saveRecipe(input, id));
      },
      async deleteRecipe(id) {
        setData(await repository.deleteRecipe(id));
      },
      async addPantryItem(item) {
        setData(await repository.addPantryItem(item));
      },
      async deletePantryItem(id) {
        setData(await repository.deletePantryItem(id));
      },
      async addShopping(items) {
        const result = await repository.addShopping(items);
        setData(result.data);
        return result.added;
      },
      async toggleShopping(id) {
        setData(await repository.toggleShopping(id));
      },
      async deleteShopping(id) {
        setData(await repository.deleteShopping(id));
      },
      async clearChecked() {
        setData(await repository.clearChecked());
      },
      async saveSettings(settings, nextKey) {
        setData(await repository.updateSettings(settings));
        await writeApiKey(nextKey);
        setApiKey(nextKey.trim() ? nextKey.trim() : null);
      },
      async resetSamples() {
        setData(await repository.resetSamples());
      },
      async clearContent() {
        setData(await repository.clearContent());
      },
    }),
    [apiKey, data, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
