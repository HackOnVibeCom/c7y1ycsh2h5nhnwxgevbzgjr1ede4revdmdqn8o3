import { RULES } from "./rules";
import type { AsoScore, ListingData, RuleCategory, RuleResult } from "./types";

export function gradeFromScore(total: number): AsoScore["grade"] {
  if (total >= 90) return "A";
  if (total >= 75) return "B";
  if (total >= 60) return "C";
  if (total >= 45) return "D";
  return "F";
}

export function score(listing: ListingData): AsoScore {
  const results: RuleResult[] = RULES.map((rule) => {
    const outcome = rule.check(listing);
    const earned = outcome.status === "pass" ? rule.max : 0;
    return {
      id: rule.id,
      label: rule.label,
      category: rule.category,
      status: outcome.status,
      earned,
      max: rule.max,
      hint: outcome.hint,
    };
  });

  const applicable = results.filter((r) => r.status !== "skip");
  const totalMax = applicable.reduce((sum, r) => sum + r.max, 0);
  const totalEarned = applicable.reduce((sum, r) => sum + r.earned, 0);
  const total = totalMax === 0 ? 0 : Math.round((totalEarned / totalMax) * 100);

  const byCategory: Partial<Record<RuleCategory, { earned: number; max: number }>> = {};
  for (const r of applicable) {
    const cur = byCategory[r.category] ?? { earned: 0, max: 0 };
    byCategory[r.category] = {
      earned: cur.earned + r.earned,
      max: cur.max + r.max,
    };
  }

  return { total, grade: gradeFromScore(total), results, byCategory };
}

export function failedRules(listing: ListingData): RuleResult[] {
  return score(listing).results.filter((r) => r.status === "fail");
}

export function listCandidates(listing: ListingData, limit: number): ListingData[] {
  const current = score(listing);
  const candidates: Array<{ candidate: ListingData; gain: number }> = [];

  const mut = (patch: Partial<ListingData>): ListingData => ({ ...listing, ...patch });

  const variants: Array<{ patch: Partial<ListingData>; label: string }> = [
    { patch: { subtitle: listing.subtitle && listing.subtitle.length <= 30 ? listing.subtitle : "Smart and simple way to do more" }, label: "add-subtitle" },
    { patch: { keywords: "smart simple daily tracker organize notes" }, label: "add-keywords" },
    { patch: { description: listing.description + "\n\n• Download now and get started in seconds." }, label: "add-cta" },
    { patch: { screenshots: listing.screenshots.length >= 3 ? listing.screenshots : [...listing.screenshots, "https://example.com/shot3.png"] }, label: "add-screenshot" },
  ];

  for (const v of variants) {
    const c = mut(v.patch);
    const g = score(c);
    if (g.total > current.total) {
      candidates.push({ candidate: c, gain: g.total - current.total });
    }
  }

  candidates.sort((a, b) => b.gain - a.gain);
  return candidates.slice(0, limit).map((c) => c.candidate);
}