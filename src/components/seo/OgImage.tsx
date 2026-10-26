/* eslint-disable @next/next/no-img-element -- these elements are drawn into a PNG by next/og, not rendered in a page */
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { Accent } from "@/lib/content";
import { getThemeTokens } from "@/theme/server";

// Share images (1200x630) for app/opengraph-image.tsx and
// app/[slug]/opengraph-image.tsx. They are drawn at build time and written
// into out/ as static PNG files.
//
// Layout from the Brand Guide v1.0 "Link / X post image": canvas page,
// heading-colour headline in Nunito Sans (two lines at most), product names in
// accent-bright, the full logo (with its tagline) bottom left at 180px wide,
// and a 60px margin inside every edge. The signature gradient runs as a
// diagonal band on the right, behind a card with the artwork (the artwork is
// drawn on white). Every colour, weight and radius comes from the active
// theme (src/theme/themes.css), so the images follow a theme switch too.
//
// next/og (Satori) supports flexbox and a subset of CSS only, and reads
// PNG/JPEG/SVG but not WebP, so artwork comes from the PNG originals in
// assets-src/. The font is Nunito Sans (OFL), bundled in assets-src/fonts/
// (Regular, SemiBold for labels, Bold for headlines, as the guide asks).

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const MARGIN = 60;

const ROOT = process.cwd();

function readAsset(file: string): Buffer {
  return fs.readFileSync(path.join(ROOT, "assets-src", file));
}

function dataUri(file: string, type: "image/png" | "image/svg+xml"): string {
  return `data:${type};base64,${readAsset(file).toString("base64")}`;
}

// Satori cannot read CSS variables, so the theme's values are read at build
// time from src/theme/themes.css (src/theme/server.ts).
function ogTheme() {
  const t = getThemeTokens();
  return {
    canvas: t.canvas, // page background
    card: t.card, // artwork card
    line: t.line, // card border
    body: t.body, // subline
    heading: t.heading, // headline
    label: t.accent, // eyebrow (small green capitals)
    productName: t["accent-bright"], // product name (large)
    chipText: t.accent,
    chipFill: t["accent-soft"],
    gradientStart: t["gradient-start"],
    gradientEnd: t["gradient-decor-end"], // decorative band, no text on it
    /** Solid circle behind the icon glyph, and the glyph on it (as IconCircle). */
    accentFill: { brand: t.brand, accent: t["accent-bright"], deep: t.inverse } satisfies Record<Accent, string>,
    accentGlyph: { brand: t["on-inverse"], accent: t["on-primary"], deep: t["on-inverse"] } satisfies Record<Accent, string>,
    radiusCard: parseInt(t["radius-card"], 10),
    weightHeading: parseInt(t["weight-heading"], 10),
    weightLabel: parseInt(t["weight-label"], 10),
    /** Label tracking (em) at the eyebrow's 22px, in whole pixels. */
    trackingLabel: Math.round(22 * parseFloat(t["tracking-label"])),
  };
}
type OgTheme = ReturnType<typeof ogTheme>;

type Artwork = {
  file: string;
  width: number;
  height: number;
  /** Part of the image to show, in its own pixels (trims empty white). */
  crop?: { x: number; y: number; width: number; height: number };
};

/** PNG originals of the app artwork, with their pixel sizes. */
export const OG_ARTWORK = {
  // The full Ka-Ezy character, on pure white with wide margins top and bottom.
  "ka-ezy-full": {
    file: "app/ka-ezy-full.png",
    width: 1200,
    height: 2460,
    crop: { x: 0, y: 340, width: 1200, height: 1860 },
  },
  agrishop: { file: "app/agrishop.png", width: 512, height: 512 },
  "produce-market": { file: "app/produce-market.png", width: 512, height: 512 },
} satisfies Record<string, Artwork>;
export type OgArtwork = keyof typeof OG_ARTWORK;

// Lucide "wallet" icon (ISC licence), for products without artwork
// (EzyCredits, whose icon is the wallet).
const WALLET_PATHS = [
  "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
  "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",
];

/** The largest the artwork card may be, inside the 60px margins. */
const CARD = { maxWidth: 400, maxHeight: OG_SIZE.height - 2 * MARGIN, padding: 28 };

function cardStyle(theme: OgTheme) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: theme.card,
    border: `1px solid ${theme.line}`,
    borderRadius: theme.radiusCard,
  } as const;
}

function ArtworkCard({ artwork, accent, theme }: { artwork?: OgArtwork; accent: Accent; theme: OgTheme }) {
  if (!artwork) {
    // The guide's icon style: a light glyph in a solid circle.
    return (
      <div style={{ ...cardStyle(theme), width: 360, height: 360 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: theme.accentFill[accent],
          }}
        >
          <svg
            width="112"
            height="112"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.accentGlyph[accent]}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {WALLET_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
          </svg>
        </div>
      </div>
    );
  }

  const art: Artwork = OG_ARTWORK[artwork];
  const crop = art.crop ?? { x: 0, y: 0, width: art.width, height: art.height };
  const inner = { width: CARD.maxWidth - 2 * CARD.padding, height: CARD.maxHeight - 2 * CARD.padding };
  const scale = Math.min(inner.width / crop.width, inner.height / crop.height);

  return (
    <div style={{ ...cardStyle(theme), padding: CARD.padding }}>
      {/* A window onto the cropped part of the image. */}
      <div
        style={{
          display: "flex",
          position: "relative",
          overflow: "hidden",
          width: Math.round(crop.width * scale),
          height: Math.round(crop.height * scale),
        }}
      >
        <img
          src={dataUri(art.file, "image/png")}
          width={Math.round(art.width * scale)}
          height={Math.round(art.height * scale)}
          alt=""
          style={{
            position: "absolute",
            left: -Math.round(crop.x * scale),
            top: -Math.round(crop.y * scale),
          }}
        />
      </div>
    </div>
  );
}

export type OgImageProps = {
  /** Section label above the headline (accent capitals). */
  eyebrow: string;
  /** Product name, shown large in accent-bright above the headline. */
  productName?: string;
  /** The headline, in the heading colour; two lines at most. */
  headline: string;
  /** One line of body copy under the headline. */
  subline?: string;
  /** Product names in accent tags along the bottom of the text. */
  chips?: string[];
  /** Colour of the icon circle when there is no artwork. */
  accent: Accent;
  artwork?: OgArtwork;
};

export function renderOgImage({ eyebrow, productName, headline, subline, chips, accent, artwork }: OgImageProps) {
  const theme = ogTheme();
  // Full lockup (mark + wordmark + tagline) at the guide's 180px.
  const logo = { width: 180, height: Math.round((180 * 298.5) / 963.5) };
  // Long product names wrap onto two lines; shrink them a little.
  const nameSize = productName && productName.length > 11 ? 80 : 96;
  const headlineSize = productName ? 46 : 88;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: theme.canvas,
          color: theme.body,
          fontFamily: "Nunito Sans",
        }}
      >
        {/* The signature gradient as a diagonal band, gradient-start to
            gradient-decor-end (no text sits on it). */}
        <svg
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <defs>
            <linearGradient id="band" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0.25" stopColor={theme.gradientStart} />
              <stop offset="1" stopColor={theme.gradientEnd} />
            </linearGradient>
          </defs>
          <polygon points="760,0 1200,0 1200,630 640,630" fill="url(#band)" />
        </svg>

        <div
          style={{
            position: "absolute",
            left: MARGIN,
            top: MARGIN,
            right: MARGIN,
            bottom: MARGIN,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 560,
              height: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: theme.weightLabel,
                  letterSpacing: theme.trackingLabel,
                  textTransform: "uppercase",
                  color: theme.label,
                }}
              >
                {eyebrow}
              </div>
              {productName ? (
                <div
                  style={{
                    fontSize: nameSize,
                    fontWeight: theme.weightHeading,
                    lineHeight: 1.02,
                    letterSpacing: -2,
                    color: theme.productName,
                    marginTop: 14,
                  }}
                >
                  {productName}
                </div>
              ) : null}
              <div
                style={{
                  fontSize: headlineSize,
                  fontWeight: theme.weightHeading,
                  lineHeight: productName ? 1.15 : 1.02,
                  letterSpacing: productName ? -0.5 : -2,
                  color: theme.heading,
                  marginTop: productName ? 16 : 14,
                  textWrap: "balance",
                }}
              >
                {headline}
              </div>
              {subline ? (
                <div style={{ fontSize: 32, lineHeight: 1.3, marginTop: 18, textWrap: "balance" }}>
                  {subline}
                </div>
              ) : null}
              {chips?.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", marginTop: 14 }}>
                  {chips.map((chip) => (
                    <div
                      key={chip}
                      style={{
                        display: "flex",
                        fontSize: 24,
                        fontWeight: theme.weightLabel,
                        padding: "6px 16px",
                        marginRight: 10,
                        marginTop: 10,
                        borderRadius: theme.radiusCard,
                        color: theme.chipText,
                        backgroundColor: theme.chipFill,
                      }}
                    >
                      {chip}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <img
              src={dataUri("brand/ezyagric-logo.svg", "image/svg+xml")}
              width={logo.width}
              height={logo.height}
              alt=""
            />
          </div>

          <ArtworkCard artwork={artwork} accent={accent} theme={theme} />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Nunito Sans", data: readAsset("fonts/NunitoSans-Regular.ttf"), weight: 400, style: "normal" },
        // Guide: headlines Bold, labels SemiBold.
        { name: "Nunito Sans", data: readAsset("fonts/NunitoSans-SemiBold.ttf"), weight: 600, style: "normal" },
        { name: "Nunito Sans", data: readAsset("fonts/NunitoSans-Bold.ttf"), weight: 700, style: "normal" },
      ],
    },
  );
}
