export type Platform = "apple" | "play";

export interface ListingData {
  platform: Platform;
  appId: string;
  storeUrl: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  description: string;
  keywords?: string;
  category?: string;
  genres?: string[];
  rating?: number;
  ratingCount?: number;
  screenshots: string[];
  iconUrl?: string;
  videoUrl?: string;
  developer?: string;
  price?: string;
  releaseNotes?: string;
  version?: string;
}

export type RuleCategory =
  | "title"
  | "subtitle"
  | "keywords"
  | "description"
  | "visual"
  | "social"
  | "category"
  | "metadata";

export type RuleStatus = "pass" | "fail" | "skip";

export interface RuleResult {
  id: string;
  label: string;
  category: RuleCategory;
  status: RuleStatus;
  earned: number;
  max: number;
  hint: string;
}

export interface AsoScore {
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  results: RuleResult[];
  byCategory: Partial<Record<RuleCategory, { earned: number; max: number }>>;
}

export interface AsoRule {
  id: string;
  label: string;
  category: RuleCategory;
  max: number;
  check: (listing: ListingData) => { status: RuleStatus; earned: number; hint: string };
}