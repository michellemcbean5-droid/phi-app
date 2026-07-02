import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExpenseCategory = 'Fuel' | 'Maintenance' | 'Insurance' | 'Tolls' | 'Miscellaneous';

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
}

interface ExpenseState {
  entries: ExpenseEntry[];
  addExpense: (category: ExpenseCategory, amount: number, description: string) => void;
  removeExpense: (id: string) => void;
  totalsByCategory: () => Record<ExpenseCategory, number>;
  totalExpenses: () => number;
}

const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      entries: [],
      addExpense: (category, amount, description) =>
        set((state) => ({
          entries: [
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, category, amount, description, date: new Date().toISOString() },
            ...state.entries,
          ],
        })),
      removeExpense: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      totalsByCategory: () => {
        const totals: Record<ExpenseCategory, number> = { Fuel: 0, Maintenance: 0, Insurance: 0, Tolls: 0, Miscellaneous: 0 };
        for (const entry of get().entries) {
          totals[entry.category] = Number((totals[entry.category] + entry.amount).toFixed(2));
        }
        return totals;
      },
      totalExpenses: () => Number(get().entries.reduce((sum, e) => sum + e.amount, 0).toFixed(2)),
    }),
    { name: 'phi_expense_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useExpenseStore;
