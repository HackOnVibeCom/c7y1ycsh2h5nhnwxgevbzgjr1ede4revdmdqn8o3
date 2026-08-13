import type { AsoRule, ListingData, RuleStatus } from "./types";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "your", "you", "are", "from", "that", "this",
  "app", "apps", "free", "best", "new", "all", "can", "into", "more", "their",
  "about", "what", "when", "get", "gives", "how", "our", "has", "have", "will",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function keywordSet(text: string): Set<string> {
  return new Set(words(text).filter((w) => !STOPWORDS.has(w)));
}

function overlap(a: string, b: string): boolean {
  const sa = keywordSet(a);
  for (const w of keywordSet(b)) {
    if (sa.has(w)) return true;
  }
  return false;
}

function countRatings(listing: ListingData): number {
  return listing.ratingCount ?? 0;
}

const titleRules: AsoRule[] = [
  {
    id: "TITLE_LENGTH",
    label: "Title length is within store limit",
    category: "title",
    max: 4,
    check: (l) => {
      const limit = l.platform === "apple" ? 30 : 50;
      return l.title.length <= limit
        ? ok()
        : fail(`Your title is ${l.title.length} chars; the ${l.platform === "apple" ? "App Store" : "Play Store"} limit is ${limit}.`);
    },
  },
  {
    id: "TITLE_HAS_KEYWORD",
    label: "Title contains a keyword from your description",
    category: "title",
    max: 3,
    check: (l) =>
      overlap(l.title, l.description)
        ? ok()
        : fail("No word from your title appears in your description — add a searchable keyword to your title."),
  },
  {
    id: "TITLE_CAPITALIZATION",
    label: "Title uses normal capitalization",
    category: "title",
    max: 2,
    check: (l) => {
      const allCaps = l.title === l.title.toUpperCase() && /[A-Z]/.test(l.title);
      return allCaps
        ? fail("All-caps titles read as spam. Use normal capitalization.")
        : ok();
    },
  },
  {
    id: "TITLE_NO_FILLER",
    label: "Title has no filler words",
    category: "title",
    max: 3,
    check: (l) => {
      const fillers = ["best", "free", "official", "2026", "ultimate", "app", "apps"];
      const found = fillers.filter((f) => l.title.toLowerCase().includes(f));
      return found.length === 0
        ? ok()
        : fail(`Filler word(s) in title: ${found.join(", ")}. Replace with a differentiating keyword.`);
    },
  },
  {
    id: "TITLE_READABLE",
    label: "Title is clean (no decorations)",
    category: "title",
    max: 2,
    check: (l) =>
      /^[\w\s\-.'!]+$/.test(l.title) && /\w{3,}/.test(l.title)
        ? ok()
        : fail("Title contains odd punctuation or is too short — keep it clean and meaningful."),
  },
];

const subtitleRules: AsoRule[] = [
  {
    id: "SUBTITLE_PRESENT",
    label: "Subtitle / short description is present",
    category: "subtitle",
    max: 4,
    check: (l) =>
      (l.subtitle ?? l.shortDescription ?? "")
        ? ok()
        : fail("No subtitle or short description. This is the second-most important ASO field."),
  },
  {
    id: "SUBTITLE_LENGTH",
    label: "Subtitle is short (≤30 chars)",
    category: "subtitle",
    max: 2,
    check: (l) => {
      const s = l.subtitle ?? l.shortDescription ?? "";
      return s && s.length <= 30 ? ok() : s ? fail(`Subtitle is ${s.length} chars — keep it under 30.`) : skip();
    },
  },
  {
    id: "SUBTITLE_HAS_KEYWORD",
    label: "Subtitle contains a keyword",
    category: "subtitle",
    max: 2,
    check: (l) => {
      const s = l.subtitle ?? l.shortDescription ?? "";
      return s && overlap(s, l.description) ? ok() : s ? fail("No keyword from your description in the subtitle.") : skip();
    },
  },
  {
    id: "SHORT_DESC_PRESENT",
    label: "Play Store short description present",
    category: "subtitle",
    max: 2,
    check: (l) =>
      l.platform !== "play" || (l.shortDescription ?? "")
        ? ok()
        : fail("Add a Play Store short description (80 chars, front-loaded with keywords)."),
  },
];

const keywordRules: AsoRule[] = [
  {
    id: "KEYWORDS_PRESENT",
    label: "iOS keywords field is filled",
    category: "keywords",
    max: 4,
    check: (l) =>
      l.platform !== "apple" || (l.keywords ?? "")
        ? ok()
        : fail("The iOS keywords field is empty — it is a direct ranking signal."),
  },
  {
    id: "KEYWORDS_NO_PUNCTUATION",
    label: "Keywords use spaces, not commas",
    category: "keywords",
    max: 2,
    check: (l) => {
      const k = l.keywords ?? "";
      return l.platform !== "apple" || !k ? skip() : !/[,\[\]"]/.test(k) ? ok() : fail("Separate keywords with spaces only — commas waste characters.");
    },
  },
  {
    id: "KEYWORDS_RELEVANT",
    label: "Keywords relate to your description",
    category: "keywords",
    max: 2,
    check: (l) => {
      const k = l.keywords ?? "";
      return l.platform !== "apple" || !k ? skip() : overlap(k, l.description) ? ok() : fail("None of your keywords appears in the description — match keywords to real content.");
    },
  },
  {
    id: "KEYWORDS_NO_STUFFING",
    label: "Keywords are not stuffed",
    category: "keywords",
    max: 2,
    check: (l) => {
      const k = l.keywords ?? "";
      const count = keywordSet(k).size;
      return l.platform !== "apple" || !k ? skip() : count <= 10 ? ok() : fail(`${count} keywords is keyword-stuffing risk — keep to 10 or fewer.`);
    },
  },
];

const descriptionRules: AsoRule[] = [
  {
    id: "DESC_PRESENT",
    label: "Description is present",
    category: "description",
    max: 5,
    check: (l) =>
      (l.description ?? "")
        ? ok()
        : fail("No description found. The description is your main ASO surface."),
  },
  {
    id: "DESC_LENGTH",
    label: "Description is long enough",
    category: "description",
    max: 5,
    check: (l) =>
      l.description.length >= 800
        ? ok()
        : fail(`Description is ${l.description.length} chars — aim for 800+ with real feature copy.`),
  },
  {
    id: "DESC_FIRST_LINE",
    label: "First line is keyword-rich",
    category: "description",
    max: 4,
    check: (l) => {
      const first = l.description.slice(0, 120);
      return overlap(first, l.title) ? ok() : fail("The first line should repeat your top keyword/phrase — it appears in search snippets.");
    },
  },
  {
    id: "DESC_HAS_FEATURES",
    label: "Description lists features/bullets",
    category: "description",
    max: 4,
    check: (l) =>
      /(\n•|\n-|\n\*|•|\*\*)/.test(l.description)
        ? ok()
        : fail("Break features into scannable bullets (• or -) — users scan, they don't read."),
  },
  {
    id: "DESC_HAS_CTA",
    label: "Description has a call to action",
    category: "description",
    max: 4,
    check: (l) =>
      /(download|get started|try now|install|join now|sign up)/i.test(l.description)
        ? ok()
        : fail("No call to action — end with a download/install prompt."),
  },
  {
    id: "DESC_HAS_KEYWORDS",
    label: "Description uses target keywords",
    category: "description",
    max: 3,
    check: (l) => {
      const kws = [...keywordSet(l.subtitle ?? ""), ...keywordSet(l.title ?? "")];
      const found = kws.filter((w) => l.keywords?.includes(w) || kws.includes(w));
      return found.length >= 1 ? ok() : fail("Reinforce your title/subtitle keywords inside the description too.");
    },
  },
];

const visualRules: AsoRule[] = [
  {
    id: "ICON_PRESENT",
    label: "App icon is present",
    category: "visual",
    max: 3,
    check: (l) => (l.iconUrl ? ok() : fail("No app icon found — the icon drives first impressions and CTR.")),
  },
  {
    id: "SCREENSHOTS_3",
    label: "At least 3 screenshots",
    category: "visual",
    max: 4,
    check: (l) =>
      l.screenshots.length >= 3 ? ok() : fail(`Only ${l.screenshots.length} screenshot(s) found — upload at least 3.`),
  },
  {
    id: "SCREENSHOTS_5",
    label: "At least 5 screenshots (maximum slots)",
    category: "visual",
    max: 3,
    check: (l) =>
      l.screenshots.length >= 5 ? ok() : fail(`${l.screenshots.length} screenshots — use all 5 slots for higher conversion.`),
  },
  {
    id: "VIDEO_PRESENT",
    label: "App preview / promo video present",
    category: "visual",
    max: 5,
    check: (l) =>
      l.videoUrl
        ? ok()
        : fail("No app preview video — video previews measurably lift conversion on both stores."),
  },
];

const socialRules: AsoRule[] = [
  {
    id: "RATING_45",
    label: "Average rating is high (≥4.5)",
    category: "social",
    max: 8,
    check: (l) => {
      const r = l.rating ?? 0;
      return r >= 4.5 ? ok() : r > 0 ? fail(`Rating is ${r.toFixed(1)} — below the 4.5+ trust threshold.`) : skip();
    },
  },
  {
    id: "RATING_COUNT_100",
    label: "At least 100 ratings",
    category: "social",
    max: 5,
    check: (l) =>
      countRatings(l) >= 100 ? ok() : countRatings(l) > 0 ? fail(`${countRatings(l)} ratings — crave 100+ social proof.`) : skip(),
  },
  {
    id: "RATING_COUNT_1000",
    label: "At least 1000 ratings",
    category: "social",
    max: 5,
    check: (l) =>
      countRatings(l) >= 1000 ? ok() : countRatings(l) > 0 ? fail(`${countRatings(l)} ratings — 1000+ strengthens conversion.`) : skip(),
  },
];

const metadataRules: AsoRule[] = [
  {
    id: "DEVELOPER_PRESENT",
    label: "Developer / publisher is identified",
    category: "metadata",
    max: 5,
    check: (l) => (l.developer ? ok() : fail("Publisher identity is missing from the listing.")),
  },
  {
    id: "CATEGORY_PRESENT",
    label: "Category / genre is set",
    category: "metadata",
    max: 5,
    check: (l) =>
      (l.category ?? "")
        ? ok()
        : fail("No category detected — choose the most relevant store category."),
  },
];

const RULES: AsoRule[] = [
  ...titleRules,
  ...subtitleRules,
  ...keywordRules,
  ...descriptionRules,
  ...visualRules,
  ...socialRules,
  ...metadataRules,
];

function ok(): { status: RuleStatus; earned: number; hint: string } {
  return { status: "pass", earned: 0, hint: "" };
}

function fail(hint: string): { status: RuleStatus; earned: number; hint: string } {
  return { status: "fail", earned: 0, hint };
}

function skip(): { status: RuleStatus; earned: number; hint: string } {
  return { status: "skip", earned: 0, hint: "" };
}

export { RULES };

export function rulesCount(): number {
  return RULES.length;
}