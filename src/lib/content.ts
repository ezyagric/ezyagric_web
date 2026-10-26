import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { SHOW_PENDING } from "./env";

// All website copy lives in content/*.yaml so the product team can edit it
// without touching layout code. Every file is validated here at build time:
// a typo in a field name or icon fails the build instead of shipping.
//
// Any claim can be marked `pending: true` (with an optional `note` saying
// what must be confirmed). Preview and staging builds show it with a
// "To confirm" badge; production builds leave it out.

export const ICON_NAMES = [
  "sprout",
  "bot",
  "mic",
  "camera",
  "clipboard-list",
  "book-open",
  "map",
  "shopping-cart",
  "package",
  "truck",
  "receipt",
  "stethoscope",
  "wallet",
  "hand-coins",
  "calendar-clock",
  "trending-up",
  "store",
  "tag",
  "map-pin",
  "check-circle",
  "smartphone",
  "users",
  "line-chart",
  "calendar",
  "leaf",
  "shield-check",
  "message-circle",
  "phone",
  "mail",
  "globe",
  "badge-percent",
  "bell",
  "piggy-bank",
] as const;

const IconName = z.enum(ICON_NAMES);
export type IconName = z.infer<typeof IconName>;

export const PRODUCT_SLUGS = [
  "ka-ezy",
  "agrishop",
  "ezycredits",
  "produce-market",
] as const;
const ProductSlug = z.enum(PRODUCT_SLUGS);
export type ProductSlug = z.infer<typeof ProductSlug>;

const pendingFields = {
  pending: z.boolean().default(false),
  note: z.string().optional(),
};

/** A sentence that may still need confirmation: a plain string, or {text, pending, note}. */
const Claim = z
  .union([z.string(), z.object({ text: z.string(), ...pendingFields })])
  .transform((v) =>
    typeof v === "string" ? { text: v, pending: false, note: undefined } : v,
  );
export type Claim = z.infer<typeof Claim>;

const Image = z.object({
  src: z.string().startsWith("/"),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type ImageData = z.infer<typeof Image>;

const Feature = z.object({
  title: z.string(),
  text: z.string(),
  icon: IconName.optional(),
  ...pendingFields,
});
export type Feature = z.infer<typeof Feature>;

const Step = z.object({ title: z.string(), text: z.string() });
export type Step = z.infer<typeof Step>;

const Faq = z.object({ q: z.string(), a: z.string(), ...pendingFields });
export type Faq = z.infer<typeof Faq>;

const Accent = z.enum(["kaezy", "leaf", "teal", "amber"]);
export type Accent = z.infer<typeof Accent>;

const ProductSchema = z.object({
  slug: ProductSlug,
  order: z.number().int(),
  name: z.string(),
  /** The line under the product's tile in the app, so site and app match. */
  appTagline: z.string(),
  accent: Accent,
  icon: IconName,
  card: z.object({
    summary: z.string(),
    points: z.array(Claim).min(1).max(4),
    image: Image.optional(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    intro: z.string(),
    image: Image.optional(),
    screenshot: Image.optional(),
  }),
  cta: z.object({ label: z.string(), campaign: z.string() }),
  availability: Claim.optional(),
  features: z.object({ title: z.string(), items: z.array(Feature).min(1) }),
  steps: z.object({ title: z.string(), items: z.array(Step).min(2) }),
  comparison: z
    .object({
      title: z.string(),
      intro: z.string().optional(),
      columns: z.array(z.object({ name: z.string(), tagline: z.string() })),
      rows: z.array(z.object({ label: z.string(), values: z.array(Claim) })),
    })
    .optional(),
  pricing: z
    .object({
      title: z.string(),
      intro: z.string(),
      /** Price cards, e.g. "Start free" / "Renew: UGX 5,000". `price` is display text. */
      tiers: z
        .array(
          z.object({
            name: z.string(),
            price: z.string(),
            text: z.string(),
            highlight: z.boolean().default(false),
            ...pendingFields,
          }),
        )
        .min(1),
      notes: z.array(Claim),
      ...pendingFields,
    })
    .optional(),
  keyFacts: z
    .object({
      title: z.string(),
      intro: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          value: z.string().nullable(),
          ...pendingFields,
        }),
      ),
      ...pendingFields,
    })
    .optional(),
  lenderLine: Claim.optional(),
  disclaimer: z.string().optional(),
  videoIds: z.array(z.string()).default([]),
  faq: z.array(Faq),
  seo: z.object({ title: z.string(), description: z.string().max(170) }),
});
export type Product = z.infer<typeof ProductSchema>;

const Video = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.enum(["farmers", "agents", "ezycredits", "company"]),
});
export type Video = z.infer<typeof Video>;

const SiteSchema = z.object({
  name: z.string(),
  legalName: z.string(),
  slogan: z.string(),
  seo: z.object({
    title: z.string(),
    description: z.string().max(170),
    googleSiteVerification: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subline: z.string(),
    smallPrint: z.array(Claim),
    screenshot: Image,
    mascot: Image,
  }),
  products: z.object({ eyebrow: z.string(), title: z.string(), intro: z.string() }),
  journey: z.object({
    title: z.string(),
    intro: z.string(),
    steps: z
      .array(
        z.object({ verb: z.string(), product: ProductSlug, text: z.string() }),
      )
      .length(4),
  }),
  alsoInApp: z.object({ title: z.string(), intro: z.string(), items: z.array(Feature) }),
  impact: z.object({
    title: z.string(),
    asOf: Claim,
    items: z.array(
      z.object({
        value: z.number(),
        /** Shown after the number, e.g. "+" for "550,000+". */
        suffix: z.string().default(""),
        label: z.string(),
        ...pendingFields,
      }),
    ),
    /** Findings from independent studies, e.g. "86%" of farmers report... */
    evidence: z
      .object({
        title: z.string(),
        items: z.array(
          z.object({ value: z.string(), label: z.string(), source: z.string() }),
        ),
      })
      .optional(),
  }),
  stories: z.object({ title: z.string(), intro: z.string() }),
  videos: z.array(Video),
  organisations: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    points: z.array(z.string()),
    cta: z.object({ label: z.string(), url: z.string().url() }),
    image: Image,
  }),
  agents: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    steps: z.array(z.string()),
    roles: z.array(z.string()),
    cta: z.object({ label: z.string(), campaign: z.string() }),
    image: Image,
  }),
  faq: z.object({ title: z.string(), items: z.array(Faq) }),
  contact: z.object({
    title: z.string(),
    intro: z.string(),
    whatsapp: z.object({ number: z.string(), message: z.string(), ...pendingFields }),
    phones: z.array(z.object({ number: z.string(), ...pendingFields })),
    emails: z.array(
      z.object({ address: z.string().email(), label: z.string(), ...pendingFields }),
    ),
    address: z.object({ lines: z.array(z.string()), mapUrl: z.string().url() }),
  }),
  partners: z.object({
    title: z.string(),
    intro: z.string().optional(),
    notice: Claim.optional(),
    groups: z.array(
      z.object({
        title: z.string(),
        items: z.array(
          z.object({ name: z.string(), logo: Image, ...pendingFields }),
        ),
      }),
    ),
  }),
  social: z.array(
    z.object({
      name: z.enum(["Facebook", "Instagram", "X", "LinkedIn", "YouTube"]),
      url: z.string().url(),
    }),
  ),
});
export type Site = z.infer<typeof SiteSchema>;

const CONTENT_DIR = path.join(process.cwd(), "content");

function readYaml(file: string): unknown {
  return parse(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"));
}

function validate<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `content/${file} is invalid:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

// Cache parsed content for the build. In `next dev` re-read the files on every
// request, so edits to content/*.yaml show up with a browser refresh.
const CACHE = process.env.NODE_ENV === "production";

let siteCache: Site | undefined;
export function getSite(): Site {
  if (siteCache && CACHE) return siteCache;
  siteCache = validate(SiteSchema, readYaml("site.yaml"), "site.yaml");
  return siteCache;
}

let productsCache: Product[] | undefined;
export function getProducts(): Product[] {
  if (productsCache && CACHE) return productsCache;
  productsCache = PRODUCT_SLUGS.map((slug) => {
    const file = `products/${slug}.yaml`;
    const product = validate(ProductSchema, readYaml(file), file);
    if (product.slug !== slug) {
      throw new Error(`content/${file}: slug must be "${slug}"`);
    }
    return product;
  }).sort((a, b) => a.order - b.order);
  return productsCache;
}

export function getProduct(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function getVideo(id: string): Video | undefined {
  return getSite().videos.find((v) => v.id === id);
}

/** Drops pending items in production builds. */
export function visible<T extends { pending: boolean }>(items: T[]): T[] {
  return SHOW_PENDING ? items : items.filter((item) => !item.pending);
}

export function isVisible(item: { pending: boolean } | undefined): boolean {
  return !!item && (SHOW_PENDING || !item.pending);
}
