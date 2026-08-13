import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AsoScore, ListingData } from "../lib/aso-rules/types";

export type Step = "landing" | "analyze" | "result" | "revise" | "launch";

export interface Revision {
  id: string;
  listing: ListingData;
  score: AsoScore;
  source: "ai" | "fallback" | "manual";
  note: string;
  createdAt: string;
}

interface AppState {
  step: Step;
  storeUrl: string;
  listing: ListingData | null;
  score: AsoScore | null;
  revisions: Revision[];
  selectedRevisionId: string | null;
  loading: boolean;
  error: string | null;

  setStep: (step: Step) => void;
  setStoreUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyAnalysis: (listing: ListingData, score: AsoScore) => void;
  addRevision: (revision: Revision) => void;
  selectRevision: (id: string) => void;
  updateListing: (patch: Partial<ListingData>) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      step: "landing",
      storeUrl: "",
      listing: null,
      score: null,
      revisions: [],
      selectedRevisionId: null,
      loading: false,
      error: null,

      setStep: (step) => set({ step }),
      setStoreUrl: (storeUrl) => set({ storeUrl }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      applyAnalysis: (listing, score) =>
        set({
          listing,
          score,
          step: "result",
          revisions: [],
          selectedRevisionId: null,
          error: null,
        }),

      addRevision: (revision) =>
        set((state) => ({
          revisions: [revision, ...state.revisions],
          selectedRevisionId: revision.id,
        })),

      selectRevision: (id) => set({ selectedRevisionId: id }),

      updateListing: (patch) =>
        set((state) =>
          state.listing
            ? { listing: { ...state.listing, ...patch } }
            : {},
        ),

      reset: () =>
        set({
          step: "landing",
          storeUrl: "",
          listing: null,
          score: null,
          revisions: [],
          selectedRevisionId: null,
          loading: false,
          error: null,
        }),
    }),
    {
      name: "launchdesk-state-v1",
      partialize: (state) => ({
        listing: state.listing,
        score: state.score,
        revisions: state.revisions,
        selectedRevisionId: state.selectedRevisionId,
        storeUrl: state.storeUrl,
        step: state.step,
      }),
    },
  ),
);