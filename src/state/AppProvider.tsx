import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppData, Ingredient, PantryItem, PlanSlot, Settings } from '../types';
import { defaultSettings } from '../types';
import { deviceStorage } from '../data/asyncStorage';
import { MemoryStorage, Repository, STORAGE_KEY, type RecipeInput } from '../data/repository';
import { readApiKey, writeApiKey } from '../data/secureKey';
import { createHomeSample, isHomeSampleRequest } from '../home/sampleHome';
import { createPlanSample, isPlanSampleRequest } from '../plan/samplePlan';

interface AppState {
  ready: boolean;
  recipes: AppData['recipes'];
  pantry: PantryItem[];
  shopping: AppData['shopping'];
  settings: Settings;
  cookLog: AppData['cookLog'];
  plan: PlanSlot[];
  apiKey: string | null;
  saveRecipe: (input: RecipeInput, id?: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addPantryItem: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  deletePantryItem: (id: string) => Promise<void>;
  addShopping: (items: Ingredient[]) => Promise<number>;
  toggleShopping: (id: string) => Promise<void>;
  deleteShopping: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  markCooked: (recipeId: string, recipeName: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  assignPlan: (date: string, recipeId: string) => Promise<void>;
  setWeekPlan: (dates: string[], slots: PlanSlot[]) => Promise<void>;
  saveSettings: (settings: Settings, apiKey: string) => Promise<void>;
  resetSamples: () => Promise<void>;
  clearContent: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);
const sharedRepository = new Repository(deviceStorage);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const repoRef = useRef(sharedRepository);

  useEffect(() => {
    let active = true;
    const boot = (async () => {
      if (isPlanSampleRequest() || isHomeSampleRequest()) {
        const storage = new MemoryStorage();
        const sample = isPlanSampleRequest() ? createPlanSample(new Date()) : createHomeSample(new Date());
        await storage.setItem(STORAGE_KEY, JSON.stringify(sample));
        repoRef.current = new Repository(storage);
      }
      return Promise.all([repoRef.current.load(), readApiKey()]);
    })();
    boot
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
      cookLog: data?.cookLog ?? [],
      plan: data?.plan ?? [],
      apiKey,
      async saveRecipe(input, id) {
        setData(await repoRef.current.saveRecipe(input, id));
      },
      async deleteRecipe(id) {
        setData(await repoRef.current.deleteRecipe(id));
      },
      async addPantryItem(item) {
        setData(await repoRef.current.addPantryItem(item));
      },
      async deletePantryItem(id) {
        setData(await repoRef.current.deletePantryItem(id));
      },
      async addShopping(items) {
        const result = await repoRef.current.addShopping(items);
        setData(result.data);
        return result.added;
      },
      async toggleShopping(id) {
        setData(await repoRef.current.toggleShopping(id));
      },
      async deleteShopping(id) {
        setData(await repoRef.current.deleteShopping(id));
      },
      async clearChecked() {
        setData(await repoRef.current.clearChecked());
      },
      async markCooked(recipeId, recipeName) {
        setData(await repoRef.current.markCooked(recipeId, recipeName));
      },
      async updateSettings(settings) {
        setData(await repoRef.current.updateSettings(settings));
      },
      async assignPlan(date, recipeId) {
        setData(await repoRef.current.assignPlan(date, recipeId));
      },
      async setWeekPlan(dates, slots) {
        setData(await repoRef.current.setWeekPlan(dates, slots));
      },
      async saveSettings(settings, nextKey) {
        setData(await repoRef.current.updateSettings(settings));
        await writeApiKey(nextKey);
        setApiKey(nextKey.trim() ? nextKey.trim() : null);
      },
      async resetSamples() {
        setData(await repoRef.current.resetSamples());
      },
      async clearContent() {
        setData(await repoRef.current.clearContent());
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
