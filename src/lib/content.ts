import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { SHOW_PENDING } from "./env";
import { THEMES } from "@/theme/themes";

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
  "play-circle",
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

const SocialNetwork = z.enum(["Facebook", "Instagram", "X", "LinkedIn", "YouTube", "TikTok"]);
export type SocialNetwork = z.infer<typeof SocialNetwork>;
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
  /**
   * What to keep in frame where the photo is cropped to fit a box, as a CSS
   * object-position ("50% 30%": the middle, near the top). If unset, the
   * component's own crop applies (the centre, or a little above it for
   * portrait photos in a product's "How it works").
   */
  focus: z
    .string()
    .regex(/^\d{1,3}% \d{1,3}%$/, 'focus is "x% y%", e.g. "50% 30%"')
    .optional(),
});
export type ImageData = z.infer<typeof Image>;

const Feature = z.object({
  title: z.string(),
  text: z.string(),
  icon: IconName.optional(),
  ...pendingFields,
});
export type Feature = z.infer<typeof Feature>;

/**
 * Where a "how it works" step can take the visitor (resolved in
 * product/Steps.tsx, so links follow the build): Google Play, the Ka-Ezy
 * demo, or the demo's question box. `label` is the link's text. On builds
 * without the Ka-Ezy demo, "try" goes to the banner's demo video and "ask"
 * to the Ka-Ezy plans instead, labelled `appLabel`.
 */
const StepAction = z.object({
  kind: z.enum(["get-app", "try-kaezy", "ask-kaezy"]),
  label: z.string(),
  appLabel: z.string().optional(),
});
export type StepAction = z.infer<typeof StepAction>;

const Step = z.object({ title: z.string(), text: z.string(), action: StepAction.optional() });
export type Step = z.infer<typeof Step>;

/**
 * A button under a FAQ answer. `kind` says where it goes (resolved in
 * ui/faqActions.ts, so links follow the build): the Ka-Ezy demo or its plans,
 * the store badges, WhatsApp or a call to the team, or a site page (`href`).
 * "try-kaezy" is always the site's one Try Ka-Ezy button and "get-app" the
 * store badges, so those two take no `label`; every other kind needs one.
 */
const FaqAction = z
  .object({
    kind: z.enum(["try-kaezy", "pay-kaezy", "get-app", "whatsapp", "call", "page"]),
    label: z.string().optional(),
    href: z.string().startsWith("/").optional(),
  })
  .refine((a) => a.kind !== "page" || !!a.href, { message: 'A "page" action needs an href' })
  .refine((a) => (a.kind === "try-kaezy" || a.kind === "get-app") === !a.label, {
    message: '"try-kaezy" and "get-app" actions take no label; every other action needs one',
  });
export type FaqAction = z.infer<typeof FaqAction>;

const Faq = z.object({
  q: z.string(),
  a: z.string(),
  /** Up to two buttons under the answer; the first is the main one. */
  actions: z.array(FaqAction).max(2).default([]),
  ...pendingFields,
});
export type Faq = z.infer<typeof Faq>;

// Product accents are theme roles, not colours: "brand" (the brand blue in
// the default theme), "accent" (green) and "deep" (dark navy).
const Accent = z.enum(["brand", "accent", "deep"]);
export type Accent = z.infer<typeof Accent>;

const TabCopy = z.object({ title: z.string(), text: z.string() });
const Prompts = z.array(z.object({ q: z.string(), a: z.string() })).min(1).max(6);

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
            /** Small label next to the price, e.g. "2% off". */
            badge: z.string().optional(),
            text: z.string(),
            highlight: z.boolean().default(false),
            /**
             * For plans that can be bought ("Hire Ka-Ezy"): length and monthly
             * price. As in the app, the total is months x monthly price; the
             * badge is display only.
             */
            months: z.number().int().positive().optional(),
            monthlyUgx: z.number().int().positive().optional(),
            ...pendingFields,
          }).refine((t) => (t.months === undefined) === (t.monthlyUgx === undefined), {
            message: "months and monthlyUgx go together",
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
  /** A real photo from the field, shown beside "How it works". */
  photo: z.object({ image: Image }).optional(),
  /**
   * Real photos of the service at work, in a band after "what it does": two
   * (landscape, portrait), four (landscape, two portrait, landscape) or six
   * (landscape, four portrait, landscape).
   */
  gallery: z
    .object({
      eyebrow: z.string().optional(),
      title: z.string(),
      intro: z.string().optional(),
      images: z.array(Image).refine((images) => [2, 4, 6].includes(images.length), "Two, four or six photos"),
    })
    .optional(),
  /** Short self-hosted product videos (public/videos), loaded only on tap. */
  demoVideos: z
    .object({
      title: z.string(),
      intro: z.string().optional(),
      items: z.array(
        z.object({
          src: z.string().startsWith("/videos/"),
          poster: Image,
          title: z.string(),
          text: z.string(),
          /** Portrait (phone-shaped) videos get a tall player in a featured card. */
          orientation: z.enum(["landscape", "portrait"]).default("landscape"),
          /** Length and size, e.g. "1 min 24 s · 11 MB", so visitors on mobile data can decide. */
          meta: z.string().optional(),
        }),
      ),
    })
    .optional(),
  /**
   * "Ask Ka-Ezy, then hire it": a chat with sample answers beside a plan and
   * Mobile Money flow (components/product/kaezy). There is no secure web API
   * for Ka-Ezy or payments yet, so the chat answers from `prompts`, preview
   * builds simulate the payment, and production sends visitors to the app to
   * pay (README, "Ka-Ezy on the website").
   */
  tryIt: z
    .object({
      eyebrow: z.string(),
      title: z.string(),
      intro: z.string(),
      /** "Your farm": personalises the demo (components/product/kaezy). */
      farm: z.object({
        title: z.string(),
        valueChain: z.string(),
        valueChainPlaceholder: z.string(),
        optionalTitle: z.string(),
        location: z.string(),
        locationHint: z.string(),
        landSize: z.string(),
        firstName: z.string(),
        firstNameHint: z.string(),
        storage: z.string(),
        storageLive: z.string(),
        pastTitle: z.string(),
        pastEmpty: z.string(),
        newConversation: z.string(),
        clear: z.string(),
      }),
      valueChains: z
        .array(
          z.object({
            group: z.string(),
            /** Picks the starter questions: crop, livestock (animals and birds) or other (fish, bees, mushrooms). */
            kind: z.enum(["crop", "livestock", "other"]),
            items: z.array(z.string()).min(1),
          }),
        )
        .min(1),
      tabs: z.object({
        expert: TabCopy,
        plan: TabCopy,
        records: TabCopy,
        mapping: TabCopy,
      }),
      chat: z.object({
        greeting: z.string(),
        greetingNamed: z.string(),
        subtitle: z.string(),
        personalised: z.string(),
        choosePrompt: z.string(),
        tryAsking: z.string(),
        placeholder: z.string(),
        /**
         * Starter questions and sample answers (paragraphs, lists, **bold**).
         * {name} {crop} {location} {acres} are filled from "Your farm"; a
         * [[ ]] part is dropped when one of its details is missing.
         */
        prompts: Prompts,
        cropPrompts: Prompts,
        livestockPrompts: Prompts,
        otherPrompts: Prompts,
        /** Sample answers only: the reply to a question the visitor types themselves. */
        ownQuestionReply: z.string(),
        /** Live answers only: what to say when Ka-Ezy can't answer. */
        errors: z.object({ offline: z.string(), busy: z.string(), limit: z.string() }),
        /** Shown after the second answer, with a link to the plans. */
        nudge: z.string(),
        disclaimer: z.string(),
      }),
      /**
       * Farm Expert's photo check (the app's diagnosis mode). Sample photos get
       * their sample diagnosis; with sample answers, the visitor's own photo
       * gets `ownPhotoReply`, since nothing on the page can check it.
       */
      diagnosis: z.object({
        title: z.string(),
        text: z.string(),
        upload: z.string(),
        samplesTitle: z.string(),
        /** Names a sample photo button for screen readers, before its question. */
        sampleLabel: z.string(),
        attach: z.string(),
        remove: z.string(),
        added: z.string(),
        unreadable: z.string(),
        placeholder: z.string(),
        /** Sent with a photo when the visitor types nothing. */
        question: z.string(),
        photoAlt: z.string(),
        privacy: z.string(),
        privacyLive: z.string(),
        ownPhotoReply: z.string(),
        pest: z.string(),
        disease: z.string(),
        signs: z.string(),
        steps: z.string(),
        sampleNote: z.string(),
        nudge: z.string(),
        samples: z
          .array(
            z.object({
              crop: z.string(),
              kind: z.enum(["pest", "disease"]),
              name: z.string(),
              // Only these paths can be shown from a saved conversation (kaezy/store.ts).
              photo: Image.extend({ src: z.string().regex(/^\/images\/diagnosis\/[a-z0-9-]+\.svg$/) }),
              question: z.string(),
              intro: z.string(),
              signs: z.array(z.string()).min(1).max(4),
              steps: z.array(z.string()).min(1).max(5),
            }),
          )
          .min(1)
          .max(4),
      }),
      plan: z.object({
        intro: z.string(),
        variety: z.string(),
        varietyAny: z.string(),
        startDate: z.string(),
        services: z.string(),
        submit: z.string(),
        edit: z.string(),
        needCrop: z.string(),
        needAcres: z.string(),
        unsupported: z.string(),
        sampleNote: z.string(),
        title: z.string(),
        nudge: z.string(),
        serviceOptions: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            flatUgx: z.number().int().nonnegative().optional(),
            perAcreUgx: z.number().int().nonnegative().optional(),
          }),
        ),
        /** Sample costed plans by crop: costs per acre, weeks from the planting date. */
        crops: z
          .array(
            z.object({
              crop: z.string(),
              varieties: z.array(z.string()),
              stages: z
                .array(z.object({ week: z.number().int(), label: z.string(), perAcreUgx: z.number().int().nonnegative() }))
                .min(1),
              harvest: z.object({
                perAcre: z.number().positive(),
                unit: z.string(),
                priceUgx: z.number().int().positive(),
              }),
            }),
          )
          .min(1),
      }),
      records: z.object({
        intro: z.string(),
        placeholder: z.string(),
        examples: z.array(z.string()).min(1),
        prompt: z.string(),
        notUnderstood: z.string(),
        saved: z.string(),
        dismissed: z.string(),
        totals: z.object({ income: z.string(), expenses: z.string(), profit: z.string() }),
        nudge: z.string(),
      }),
      mapping: z.object({
        intro: z.string(),
        steps: z.array(z.string()).min(1),
        tryTitle: z.string(),
        sample: z.string(),
        undo: z.string(),
        clear: z.string(),
        finish: z.string(),
        result: z.string(),
        useSize: z.string(),
        planIt: z.string(),
        nudge: z.string(),
      }),
      hire: z.object({
        title: z.string(),
        intro: z.string(),
        benefits: z.array(z.string()),
        accountHelp: z.string(),
        policy: z.string(),
        /** Production, until web payment is connected: how to hire in the app instead. */
        appHandoff: z.string(),
      }),
      ...pendingFields,
    })
    .optional(),
  videoIds: z.array(z.string()).default([]),
  faq: z.array(Faq),
  seo: z.object({ title: z.string(), description: z.string().max(170) }),
});
export type Product = z.infer<typeof ProductSchema>;

const Video = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.enum(["farmers", "app", "ezycredits", "company", "media"]),
  /** Shown in the home page's first row of stories (before "More videos"). */
  featured: z.boolean().default(false),
});
export type Video = z.infer<typeof Video>;

const SiteSchema = z.object({
  /** Which theme in src/theme/themes.css styles the site. */
  theme: z.enum(THEMES).default("ezyagric"),
  name: z.string(),
  legalName: z.string(),
  slogan: z.string(),
  /** The Ka-Ezy banner repeated across the site (components/promo/KaEzyBanner). */
  kaezyBanner: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    /** The Ka-Ezy demo video (the portrait one in ka-ezy.yaml) plays in the banner. */
    watch: z.object({ title: z.string() }),
    try: z.object({
      title: z.string(),
      text: z.string(),
      /** Used while the website demo is not shown (production, until it is approved). */
      appText: z.string(),
    }),
    pay: z.object({ title: z.string(), text: z.string(), link: z.string() }),
    app: z.object({ title: z.string(), text: z.string() }),
    /** The one-line version for menus and the Ka-Ezy page. */
    strip: z.object({ label: z.string(), watch: z.string(), try: z.string(), pay: z.string() }),
  }),
  /** The iPhone app: the App Store badge appears once `url` is set (see StoreBadges). */
  appStore: z.object({
    url: z.string().url().nullable().default(null),
    comingSoon: z.string(),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string().max(170),
    googleSiteVerification: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subline: z.string(),
    screenshot: Image,
    mascot: Image,
  }),
  products: z.object({ eyebrow: z.string(), title: z.string(), intro: z.string() }),
  journey: z.object({
    title: z.string(),
    intro: z.string(),
    steps: z
      .array(
        z.object({
          verb: z.string(),
          product: ProductSlug,
          text: z.string(),
          /** A real photo of the step from the field, on its card (components/home/Journey). */
          image: Image,
        }),
      )
      .length(4),
  }),
  alsoInApp: z.object({
    title: z.string(),
    intro: z.string(),
    items: z.array(
      Feature.extend({
        /** The small illustration on its tile (components/home/AlsoInApp); none for a plain tile. */
        visual: z.enum(["records", "mapping", "calendar", "guides"]).optional(),
      }),
    ),
  }),
  /**
   * Livestock (components/home/Livestock): a farmer's video, what each
   * product does for livestock farmers, and stills from the video. No
   * section without it.
   */
  livestock: z
    .object({
      eyebrow: z.string(),
      title: z.string(),
      /** Self-hosted (public/videos), like the Ka-Ezy demo videos. */
      video: z.object({
        src: z.string().regex(/^\/videos\/[a-z0-9-]+\.mp4$/),
        title: z.string(),
        poster: Image,
      }),
      /** One tile per product, under its name, so the text need not name it. */
      points: z.array(z.object({ product: ProductSlug, text: z.string() })).length(4),
      photos: z.array(Image).length(4),
    })
    .optional(),
  impact: z.object({
    title: z.string(),
    /** Optional date line under the title, e.g. "As of October 2026". */
    asOf: Claim.optional(),
    /** A real farmer photo shown beside the figures. */
    image: Image.optional(),
    /** Up to two more farmer photos, beside the first in a mosaic (needs `image`). */
    gallery: z.array(Image).max(2).default([]),
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
          z.object({ value: z.string(), label: z.string(), source: z.string().optional() }),
        ),
      })
      .optional(),
  }),
  stories: z.object({
    title: z.string(),
    intro: z.string(),
    /** Link to the full YouTube channel. */
    channel: z.object({ label: z.string(), url: z.string().url() }).optional(),
  }),
  videos: z.array(Video),
  organisations: z.object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    /** What the platform does, each with its icon on its tile. */
    points: z.array(z.object({ text: z.string(), icon: IconName })),
    cta: z.object({ label: z.string(), url: z.string().url() }),
    /** The platform on a laptop and tablet: a transparent PNG/WebP, shown on a tinted panel. */
    image: Image,
  }),
  faq: z.object({
    title: z.string(),
    intro: z.string().optional(),
    items: z.array(Faq),
    /** The card beside the questions: ask Ka-Ezy, or the team on WhatsApp. */
    help: z
      .object({ title: z.string(), text: z.string(), whatsapp: z.string() })
      .optional(),
  }),
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
        /** Beside the group's name (components/home/Partners). */
        icon: IconName.optional(),
        items: z.array(
          // No logo yet: the tile shows the name (see Partners).
          z.object({ name: z.string(), logo: Image.optional(), ...pendingFields }),
        ),
      }),
    ),
  }),
  social: z.array(
    z.object({
      name: SocialNetwork,
      url: z.string().url(),
      ...pendingFields,
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
