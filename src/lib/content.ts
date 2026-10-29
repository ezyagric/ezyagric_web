import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { SHOW_PENDING } from "./env";
import { linkProblems } from "./richText";
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
  "monitor",
  "plug",
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
 * Where a step can take the visitor (a product's "how it works" step or a
 * home journey step; resolved in product/Steps.tsx, so links follow the
 * build): Google Play, the Ka-Ezy demo or its question box, the Ka-Ezy plans,
 * WhatsApp or a call to the team, Partner login, or a page of the site
 * (`href`, e.g. "/ezycredits/#key-facts"). `label` is the link's text. On
 * builds without the Ka-Ezy demo, "try" goes to the banner's demo video and
 * "ask" to the Ka-Ezy plans instead, labelled `appLabel`. A step whose
 * target is hidden on the build (an unconfirmed WhatsApp number) shows no link.
 */
const StepAction = z
  .object({
    kind: z.enum(["get-app", "try-kaezy", "ask-kaezy", "pay-kaezy", "whatsapp", "call", "page", "portal"]),
    label: z.string(),
    appLabel: z.string().optional(),
    href: z.string().startsWith("/").optional(),
  })
  .refine((a) => (a.kind === "page") === !!a.href, { message: 'Only a "page" action takes an href, and it needs one' })
  .refine((a) => !a.appLabel || a.kind === "try-kaezy" || a.kind === "ask-kaezy", {
    message: "appLabel is only for try-kaezy and ask-kaezy",
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
    /** portal: Partner login (the EzyAgric Business sign-in, PORTAL_URL). */
    kind: z.enum(["try-kaezy", "pay-kaezy", "get-app", "whatsapp", "call", "page", "portal"]),
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
          /** true: the value is the site's contact channels (call, WhatsApp, email), as links. */
          contact: z.boolean().optional(),
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
          /** The step's link under its text (as a product's steps). */
          action: StepAction.optional(),
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
    /** How it connects, as chips under the chapter fan ("Web portal", "APIs"). */
    channels: z.array(z.strictObject({ icon: IconName, text: z.string() })).max(4).default([]),
    /**
     * The way in: the EzyAgric Business page (the chapter pages and their
     * screens come from content/business.yaml).
     */
    cta: z.object({ label: z.string(), href: z.string().startsWith("/") }),
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
        /** On the group's register page, beside its name (components/home/Partners). */
        icon: IconName.optional(),
        items: z.array(
          // No logo yet: the entry shows the name (see Partners).
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

/**
 * EzyAgric Business (content/business.yaml): the four services for
 * agribusiness enterprises, as a web portal or APIs. Each module brings one
 * farmer-app service (`product`) to the enterprises that work with farmers.
 */
/** "x% y% w% h%" of a screen: a loupe's detail, or a blurred name. */
const Region = z
  .string()
  .regex(/^(\d{1,3}(\.\d)?% ){3}\d{1,3}(\.\d)?%$/, 'region is "x% y% w% h%", e.g. "60.3% 49.9% 39.2% 39.6%"');

const Loupe = z.object({
  src: z.string().startsWith("/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string(),
  region: Region.optional(),
});
export type LoupeData = z.infer<typeof Loupe>;

/** EzyAgric Business's two promises (business.yaml `promises`). Not "Promise": that is a global. */
const PromiseKind = z.enum(["privacy", "investment"]);
export type PromiseKind = z.infer<typeof PromiseKind>;

/** A module's point; `stamp` adds one of the promises' stamps under it. */
const BusinessPoint = z
  .union([
    z.string(),
    z.object({ text: z.string(), stamp: z.object({ promise: PromiseKind, text: z.string() }).optional(), ...pendingFields }),
  ])
  .transform((v) => (typeof v === "string" ? { text: v, stamp: undefined, pending: false, note: undefined } : v));

/** A way in's point; `promise` swaps the green tick for that promise's mark. */
const MarkedClaim = z
  .union([z.string(), z.object({ text: z.string(), promise: PromiseKind.optional(), ...pendingFields })])
  .transform((v) => (typeof v === "string" ? { text: v, promise: undefined, pending: false, note: undefined } : v));

const BusinessModule = z.object({
  /** The module's anchor on the page (#ezyproduce). */
  id: z.enum(["ezysupplier", "ezyproduce", "ezycredits", "ezyservices"]),
  name: z.string(),
  /** Who it is for: "For input suppliers". */
  audience: z.string(),
  /** The farmer-app service it is built on; its icon and colour are the module's. */
  product: ProductSlug,
  summary: z.string(),
  points: z.array(BusinessPoint).min(1).max(5),
  /**
   * The module's screen beside its text, in a browser window (frame: false
   * for a device mockup, shown on a tinted panel instead). Personal data
   * blurred out.
   */
  screen: Image.extend({ frame: z.boolean().default(true) }),
  /** A close 16:10 crop of a screen, for the home page's chapter fan and the hero's Contents card; `focus` picks the phones' 16:6 strip. */
  thumb: Image,
  /**
   * A magnified detail of the screen beside it (decorative: the screen's alt
   * describes it). `region` frames that detail on the screen, as "x% y% w% h%"
   * of the screen; leave it out when the detail is not cut from it.
   */
  loupe: Loupe.optional(),
  /** A small illustrative notification on the screen: no figures, decorative. */
  status: z.object({ icon: IconName, title: z.string(), text: z.string() }).optional(),
  /** A field photo of the people the module serves, clipped to the chapter (from lg). */
  photo: Image.optional(),
  ...pendingFields,
});
export type BusinessModule = z.infer<typeof BusinessModule>;

const BusinessSchema = z.object({
  name: z.string(),
  /** Its line on the home hero's slide, like a product's appTagline, and on the menus' card. */
  tagline: z.string(),
  /** The header's Agribusiness Services menu: its card (desktop) and strip (phones). */
  menu: z.object({ eyebrow: z.string(), explore: z.string(), talk: z.string() }),
  hero: z.object({
    eyebrow: z.string(),
    /** ==key words== in green, as on the product pages. */
    headline: z.string(),
    intro: z.string(),
    /** The Contents card beside the text: one row per module. */
    contents: z.object({ label: z.string(), note: z.string().optional() }),
  }),
  modules: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    intro: z.string().optional(),
    /** The name of the sticky module index (a nav landmark). */
    indexLabel: z.string(),
    /** The WhatsApp button in each chapter; {module} becomes the module's name. */
    ask: z.object({ label: z.string().includes("{module}"), message: z.string() }),
    /** The Ka-Ezy-built module's link down to the Ka-Ezy banner. */
    kaezyLink: z.string().optional(),
    items: z.array(BusinessModule).length(4),
  }),
  /**
   * The two promises (privacy and security; no heavy upfront investment),
   * on navy just before the two ways in.
   */
  promises: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    intro: z.string().optional(),
    /** Below the sheet: the marks to look for further down the page. */
    key: z.object({ label: z.string(), privacy: z.string(), investment: z.string() }),
    privacy: z.object({
      label: z.string(),
      title: z.string(),
      lead: z.string(),
      listLabel: z.string(),
      points: z.array(z.object({ label: z.string(), text: z.string(), ...pendingFields })).min(1).max(6),
      link: z.object({ label: z.string(), href: z.string().startsWith("/") }),
    }),
    investment: z.object({
      label: z.string(),
      stamp: z.string(),
      title: z.string(),
      lead: z.string(),
      listLabel: z.string(),
      /** "Instead of" lines struck through, each corrected by what EzyAgric Business does. */
      rows: z.array(z.object({ instead: z.string(), ezyagric: z.string(), ...pendingFields })).min(2).max(6),
      total: z.object({ label: z.string(), struck: z.string(), value: z.string() }),
      footnote: z.string(),
      link: z.object({ label: z.string(), href: z.string().startsWith("#") }),
    }),
  }),
  /** This page's line under the Ka-Ezy banner's title (the farmer price is not the enterprise's). */
  kaezyBanner: z.object({ intro: z.string() }).optional(),
  /** How enterprises connect: the web portal, and APIs into their own systems. */
  access: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    intro: z.string().optional(),
    /** The gradient hub the two ways in hang from. */
    hub: z.object({ label: z.string(), text: z.string() }),
    items: z
      .array(
        z.object({
          title: z.string(),
          text: z.string(),
          icon: IconName,
          points: z.array(MarkedClaim).min(1),
          /** portal: the screen on top and Partner login; api: the plug strip and a WhatsApp button. */
          kind: z.enum(["portal", "api"]),
          button: z.string(),
          /** The WhatsApp message of an api card's button. */
          message: z.string().optional(),
          /** portal: a WhatsApp button beside Partner login, for enterprises not on it yet. */
          ask: z.object({ label: z.string(), message: z.string() }).optional(),
          /** The api card's illustration: from EzyAgric Business to the enterprise's system. */
          plug: z.object({ from: z.string(), to: z.string(), label: z.string() }).optional(),
        }),
      )
      .length(2),
    /** A web portal screen beside the ways in, with a caption under it. */
    /** `blurred` frames the blurred customer details on the screen (a dashed frame with an eye pin). */
    screen: z.object({ image: Image, caption: z.string(), blurred: Region.optional() }).optional(),
  }),
  pricing: z.object({
    title: z.string(),
    text: z.string(),
    /** The WhatsApp message the "Talk to our team" buttons start. */
    whatsappMessage: z.string(),
    image: Image,
    /** The quotation slip: its label, a stamp, line items and the price line. */
    slip: z.object({
      label: z.string(),
      stamp: z.string(),
      rows: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
            modules: z.boolean().default(false),
            /** One of the promises: its mark beside the value. */
            promise: PromiseKind.optional(),
          }),
        )
        .min(1)
        .max(5),
      price: z.object({ label: z.string(), value: z.string() }),
    }),
    /** The slip's tear-off stub: the photo, a title, the WhatsApp button and every channel. */
    stub: z.object({ title: z.string(), button: z.string() }),
  }),
  faq: z.object({ eyebrow: z.string().optional(), title: z.string(), items: z.array(Faq).default([]) }),
  seo: z.object({ title: z.string(), description: z.string().max(170) }),
});
export type Business = z.infer<typeof BusinessSchema>;

const CONTENT_DIR = path.join(process.cwd(), "content");

function readYaml(file: string): unknown {
  return parse(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"));
}

// The site's pages, for [words](target) links in copy (lib/richText).
const PAGES = ["/", "/ezyagric-business/", "/privacy-policy/", ...PRODUCT_SLUGS.map((slug) => `/${slug}/`)];

/**
 * Where copy may carry [words](target) links: the fields whose components
 * render them (Highlight, RichText). Anywhere else a link would show as raw
 * brackets, leak into a meta tag or share image, or sit inside another link,
 * so the build stops. Paths are the YAML's own ("faq.items.2.a").
 */
const LINK_FIELDS = {
  site: /^(hero\.subline|products\.intro|organisations\.intro|faq\.items\.\d+\.a|alsoInApp\.items\.\d+\.text)$/,
  product:
    /^(card\.summary|card\.points\.\d+(\.text)?|hero\.intro|features\.items\.\d+\.text|steps\.items\.\d+\.text|faq\.\d+\.a|tryIt\.intro)$/,
  business: /^(hero\.intro|faq\.items\.\d+\.a|kaezyBanner\.intro)$/,
};

/** Stops the build on a link where it can't show, or to a page that doesn't exist. */
function checkLinks(data: unknown, file: string, fields: RegExp): void {
  const walk = (value: unknown, at: string[]): void => {
    if (typeof value === "string") {
      if (!value.includes("](")) return;
      const path = at.join(".");
      // The Ka-Ezy demo's sample answers are Markdown of their own (MiniMarkdown).
      if (path.startsWith("tryIt.") && path !== "tryIt.intro") return;
      const problems = fields.test(path) ? linkProblems(value, PAGES) : ["links aren't shown here"];
      if (problems.length > 0) throw new Error(`content/${file}: ${path}: ${problems.join("; ")}`);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, [...at, String(i)]));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) walk(item, [...at, key]);
    }
  };
  walk(data, []);
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
  const data = readYaml("site.yaml");
  checkLinks(data, "site.yaml", LINK_FIELDS.site);
  siteCache = validate(SiteSchema, data, "site.yaml");
  return siteCache;
}

let businessCache: Business | undefined;
export function getBusiness(): Business {
  if (businessCache && CACHE) return businessCache;
  const data = readYaml("business.yaml");
  checkLinks(data, "business.yaml", LINK_FIELDS.business);
  businessCache = validate(BusinessSchema, data, "business.yaml");
  return businessCache;
}

let productsCache: Product[] | undefined;
export function getProducts(): Product[] {
  if (productsCache && CACHE) return productsCache;
  productsCache = PRODUCT_SLUGS.map((slug) => {
    const file = `products/${slug}.yaml`;
    const data = readYaml(file);
    checkLinks(data, file, LINK_FIELDS.product);
    const product = validate(ProductSchema, data, file);
    // A step with an action is one big link: a link in its text couldn't be clicked.
    product.steps.items.forEach((step, i) => {
      if (step.action && step.text.includes("](")) {
        throw new Error(`content/${file}: steps.items.${i}.text: no links in a step that has an action`);
      }
    });
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

/** A module with the farmer-app service it is built on in place of its slug. */
export type BusinessModuleWithProduct = Omit<BusinessModule, "product"> & { product: Product };

/** EzyAgric Business's four modules, each with the farmer-app service it is built on. */
export function getBusinessModules(): BusinessModuleWithProduct[] {
  return getBusiness().modules.items.flatMap((module) => {
    const product = getProduct(module.product);
    return product ? [{ ...module, product }] : [];
  });
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

/** True if anything in the site's content still waits for confirmation (`pending: true`). */
export function hasPendingContent(): boolean {
  const walk = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(walk);
    if (value && typeof value === "object") {
      if ((value as { pending?: unknown }).pending === true) return true;
      return Object.values(value).some(walk);
    }
    return false;
  };
  return walk(getSite()) || walk(getProducts()) || walk(getBusiness());
}
