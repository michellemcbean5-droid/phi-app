import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type BlueprintStage =
  | 'Readiness'
  | 'Business Setup'
  | 'Federal Registration'
  | 'Authority Activation'
  | 'Safety Foundation'
  | 'Launch Operations';

export interface BlueprintStep {
  id: string;
  stage: BlueprintStage;
  title: string;
  description: string;
  actionLabel: string;
  resourceUrl?: string;
  resourceLabel?: string;
  isRequired: boolean;
}

export const BUSINESS_BLUEPRINT_STEPS: BlueprintStep[] = [
  {
    id: 'operating-plan',
    stage: 'Readiness',
    title: 'Define your operating plan',
    description: 'Choose the lanes, equipment, cargo, home base, and work style that fit your first six months.',
    actionLabel: 'Write down your plan and keep it in your records.',
    isRequired: true,
  },
  {
    id: 'entity-ein',
    stage: 'Business Setup',
    title: 'Choose a business structure and request an EIN',
    description: 'Prepare your legal business name, formation choice, tax identification, and dedicated business banking plan.',
    actionLabel: 'Confirm the sequence with a qualified tax or legal professional for your situation.',
    resourceUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers',
    resourceLabel: 'IRS EIN information',
    isRequired: true,
  },
  {
    id: 'business-banking',
    stage: 'Business Setup',
    title: 'Separate personal and business money',
    description: 'Set up a dedicated business account and choose a simple system for receipts, taxes, maintenance, and fuel reserves.',
    actionLabel: 'Create a receipt and recordkeeping routine before accepting freight.',
    isRequired: true,
  },
  {
    id: 'registration-needs',
    stage: 'Federal Registration',
    title: 'Confirm your FMCSA registration needs',
    description: 'Your required registration depends on your company type, cargo, and interstate or intrastate operation.',
    actionLabel: 'Review the official registration decision information before you apply.',
    resourceUrl: 'https://www.fmcsa.dot.gov/registration/getting-started',
    resourceLabel: 'FMCSA registration starting point',
    isRequired: true,
  },
  {
    id: 'usdot-number',
    stage: 'Federal Registration',
    title: 'Apply for your USDOT number when required',
    description: 'Record your carrier details accurately and keep the registration information current.',
    actionLabel: 'Apply through the official FMCSA process only.',
    resourceUrl: 'https://www.fmcsa.dot.gov/registration/getting-started',
    resourceLabel: 'FMCSA USDOT registration guidance',
    isRequired: true,
  },
  {
    id: 'operating-authority',
    stage: 'Federal Registration',
    title: 'Determine whether operating authority is required',
    description: 'Interstate for-hire operations involving federally regulated commodities may need operating authority in addition to a USDOT number.',
    actionLabel: 'Choose authority types carefully; filing fees may not be refundable.',
    resourceUrl: 'https://www.fmcsa.dot.gov/registration/get-mc-number-authority-operate',
    resourceLabel: 'FMCSA operating authority guidance',
    isRequired: true,
  },
  {
    id: 'insurance-quote',
    stage: 'Authority Activation',
    title: 'Secure the insurance coverage your operation requires',
    description: 'Compare policies with a commercial-trucking insurance professional and confirm filings and coverage match your intended authority.',
    actionLabel: 'Keep policy, agent, and renewal details in your secure records.',
    resourceUrl: 'https://www.fmcsa.dot.gov/registration/insurance-requirements',
    resourceLabel: 'FMCSA insurance requirements',
    isRequired: true,
  },
  {
    id: 'process-agent',
    stage: 'Authority Activation',
    title: 'Confirm required process-agent and activation filings',
    description: 'Verify the filings and activation status required for your authority type before hauling regulated interstate freight.',
    actionLabel: 'Check official status; do not rely on third-party promises.',
    resourceUrl: 'https://www.fmcsa.dot.gov/registration/get-mc-number-authority-operate',
    resourceLabel: 'FMCSA authority status guidance',
    isRequired: true,
  },
  {
    id: 'authority-status',
    stage: 'Authority Activation',
    title: 'Verify authority status before booking freight',
    description: 'Use the official licensing and insurance lookup to review the status tied to your USDOT or MC number.',
    actionLabel: 'Save a date-stamped status check in your records.',
    resourceUrl: 'https://li-public.fmcsa.dot.gov/LIVIEW/pkg_carrquery.prc_carrlist',
    resourceLabel: 'FMCSA licensing and insurance lookup',
    isRequired: true,
  },
  {
    id: 'new-entrant-records',
    stage: 'Safety Foundation',
    title: 'Set up safety and maintenance records',
    description: 'Build a repeatable file system for driver qualifications, inspections, maintenance, hours of service, and controlled-substance requirements.',
    actionLabel: 'Document your routine before the first dispatch.',
    resourceUrl: 'https://www.fmcsa.dot.gov/safety/new-entrant-safety-assurance-program',
    resourceLabel: 'FMCSA New Entrant guidance',
    isRequired: true,
  },
  {
    id: 'new-entrant-audit',
    stage: 'Safety Foundation',
    title: 'Prepare for the New Entrant safety audit',
    description: 'New Entrants are monitored during an initial 18-month period, and a safety audit may occur within the first 12 months.',
    actionLabel: 'Review the safety-audit expectations and retain requested records.',
    resourceUrl: 'https://www.fmcsa.dot.gov/safety/new-entrant-safety-assurance-program',
    resourceLabel: 'FMCSA safety audit overview',
    isRequired: true,
  },
  {
    id: 'broker-vetting',
    stage: 'Launch Operations',
    title: 'Create your broker and shipper verification routine',
    description: 'Before committing, confirm company details, written rate terms, pickup and delivery facts, and payment expectations.',
    actionLabel: 'Use the Dispatch Hub pre-booking checklist for every new relationship.',
    isRequired: true,
  },
  {
    id: 'cash-reserve',
    stage: 'Launch Operations',
    title: 'Fund your fuel and maintenance reserve',
    description: 'Plan for operating expenses and payment timing before accepting your first loads.',
    actionLabel: 'Set a starting reserve target in Cash Flow once the tool is configured.',
    isRequired: true,
  },
];

interface BusinessBlueprintState {
  completedStepIds: string[];
  lastUpdatedAt?: string;
  toggleStep: (stepId: string) => void;
  resetBlueprint: () => void;
}

const useBusinessBlueprintStore = create<BusinessBlueprintState>()(
  persist(
    (set) => ({
      completedStepIds: [],
      lastUpdatedAt: undefined,
      toggleStep: (stepId) =>
        set((state) => ({
          completedStepIds: state.completedStepIds.includes(stepId)
            ? state.completedStepIds.filter((id) => id !== stepId)
            : [...state.completedStepIds, stepId],
          lastUpdatedAt: new Date().toISOString(),
        })),
      resetBlueprint: () => set({ completedStepIds: [], lastUpdatedAt: new Date().toISOString() }),
    }),
    {
      name: 'phi_business_blueprint_store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useBusinessBlueprintStore;
