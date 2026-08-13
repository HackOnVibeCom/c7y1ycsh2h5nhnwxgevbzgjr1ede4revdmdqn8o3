import { z } from "zod";

export const RevisedListingSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(""),
  shortDescription: z.string().default(""),
  description: z.string(),
  keywords: z.string().default(""),
  category: z.string().default(""),
  developer: z.string().default(""),
  price: z.string().default(""),
  note: z.string().describe("Summary of what changed and why"),
});

export type RevisedListing = z.infer<typeof RevisedListingSchema>;

export interface ReviseRequest {
  listing: {
    platform: "apple" | "play";
    title: string;
    subtitle?: string;
    shortDescription?: string;
    description: string;
    keywords?: string;
    category?: string;
  };
  targetScore: number;
}

export type ReviseOutput =
  | { ok: true; revised: RevisedListing; source: "ai" | "fallback" }
  | { ok: false; error: string };