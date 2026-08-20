import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addDaysToIsoDate } from '../utils/rookieOwnerOperatorFinance';

export type PaymentMethod = 'Standard Pay' | 'Quick Pay' | 'Factoring';
export type InvoiceStatus = 'pending' | 'paid';

export interface CashFlowInvoice {
  id: string;
  brokerName: string;
  invoiceNumber: string;
  amount: number;
  submittedOn: string;
  expectedPaymentOn: string;
  paymentMethod: PaymentMethod;
  feePercent: number;
  status: InvoiceStatus;
}

export interface CashFlowSettings {
  startingCash: number;
  fuelReserve: number;
  maintenanceReserve: number;
}

export interface CreateCashFlowInvoice {
  brokerName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  feePercent: number;
  standardPaymentDays: number;
}

interface CashFlowState {
  settings: CashFlowSettings;
  invoices: CashFlowInvoice[];
  updateSettings: (update: Partial<CashFlowSettings>) => void;
  addInvoice: (invoice: CreateCashFlowInvoice) => void;
  markInvoicePaid: (invoiceId: string) => void;
  removeInvoice: (invoiceId: string) => void;
}

const useCashFlowStore = create<CashFlowState>()(
  persist(
    (set) => ({
      settings: {
        startingCash: 0,
        fuelReserve: 500,
        maintenanceReserve: 500,
      },
      invoices: [],
      updateSettings: (update) =>
        set((state) => ({ settings: { ...state.settings, ...update } })),
      addInvoice: (draft) =>
        set((state) => {
          const submittedOn = new Date().toISOString();
          const expectedPaymentOn = addDaysToIsoDate(new Date(), draft.standardPaymentDays);
          return {
            invoices: [
              {
                id: `invoice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                brokerName: draft.brokerName.trim(),
                invoiceNumber: draft.invoiceNumber.trim(),
                amount: Number(draft.amount.toFixed(2)),
                submittedOn,
                expectedPaymentOn,
                paymentMethod: draft.paymentMethod,
                feePercent: Number(draft.feePercent.toFixed(2)),
                status: 'pending',
              },
              ...state.invoices,
            ],
          };
        }),
      markInvoicePaid: (invoiceId) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === invoiceId ? { ...invoice, status: 'paid' } : invoice,
          ),
        })),
      removeInvoice: (invoiceId) =>
        set((state) => ({ invoices: state.invoices.filter((invoice) => invoice.id !== invoiceId) })),
    }),
    {
      name: 'phi_cash_flow_store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useCashFlowStore;
