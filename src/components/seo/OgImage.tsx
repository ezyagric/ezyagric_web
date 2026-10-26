/* eslint-disable @next/next/no-img-element -- these elements are drawn into a PNG by next/og, not rendered in a page */
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { Accent } from "@/lib/content";
import { SITE_URL } from "@/lib/env";

// Share images (1200x630) for app/opengraph-image.tsx and
// app/[slug]/opengraph-image.tsx. They are drawn at build time and written
// into out/ as static PNG files.
//
// next/og (Satori) supports flexbox and a subset of CSS only, and reads
// PNG/JPEG but not WebP, so artwork comes from the PNG originals in
// assets-src/. The font is Nunito Sans (OFL), bundled in assets-src/fonts/.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ROOT = process.cwd();

function readAsset(file: string): Buffer {
  return fs.readFileSync(path.join(ROOT, "assets-src", file));
}

function pngDataUri(file: string): string {
  return `data:image/png;base64,${readAsset(file).toString("base64")}`;
}

// Brand tokens from src/app/globals.css (Satori cannot read CSS variables).
const COLOR = {
  brand900: "#16486c",
  brand700: "#1f6da3",
  brand100: "#d3e7f5",
  ink: "#1e3a5c",
  white: "#ffffff",
};

/** Decorative accent colours (the *-500 tokens; Ka-Ezy uses brand-500). */
const ACCENT_HEX: Record<Accent, string> = {
  kaezy: "#2f86c2",
  leaf: "#589165",
  teal: "#149078",
  amber: "#f57c00",
};

/** Soft tints (the *-50 tokens) behind artwork and icons. */
const ACCENT_SOFT: Record<Accent, string> = {
  kaezy: "#e9f1f9",
  leaf: "#edf5ef",
  teal: "#e7f4f1",
  amber: "#fdf3e7",
};

/** PNG originals of the app artwork, with their pixel sizes. */
export const OG_ARTWORK = {
  "ka-ezy-phone": { file: "app/ka-ezy-phone.png", width: 833, height: 1501 },
  agrishop: { file: "app/agrishop.png", width: 512, height: 512 },
  "produce-market": { file: "app/produce-market.png", width: 512, height: 512 },
} as const;
export type OgArtwork = keyof typeof OG_ARTWORK;

// Lucide "wallet" icon (ISC licence), for products without artwork.
const WALLET_PATHS = [
  "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
  "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",
];

const ART_BOX = { width: 400, height: 470, padding: 20 };

function Artwork({ artwork, accent }: { artwork?: OgArtwork; accent: Accent }) {
  const art = artwork ? OG_ARTWORK[artwork] : undefined;
  // Fit the artwork inside the box with some white space around it.
  const scale = art
    ? Math.min(
        (ART_BOX.width - 2 * ART_BOX.padding) / art.width,
        (ART_BOX.height - 2 * ART_BOX.padding) / art.height,
      )
    : 1;
  const box = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // Tall artwork gets a narrower card, leaving more room for the text.
    width: art ? Math.min(ART_BOX.width, Math.round(art.width * scale) + 100) : ART_BOX.width,
    height: ART_BOX.height,
    borderRadius: 40,
    flexShrink: 0,
  } as const;

  if (!art) {
    return (
      <div style={{ ...box, backgroundColor: ACCENT_SOFT[accent] }}>
        <svg
          width="240"
          height="240"
          viewBox="0 0 24 24"
          fill="none"
          stroke={ACCENT_HEX[accent]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {WALLET_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div style={{ ...box, backgroundColor: COLOR.white }}>
      <img
        src={pngDataUri(art.file)}
        width={Math.round(art.width * scale)}
        height={Math.round(art.height * scale)}
        alt=""
      />
    </div>
  );
}

export type OgImageProps = {
  /** Small line above the title. */
  eyebrow: string;
  /** Product or site name, shown large. */
  title: string;
  /** One line under the title (the product's app tagline). */
  tagline: string;
  accent: Accent;
  artwork?: OgArtwork;
  /** Optional pills along the bottom (e.g. the four product names). */
  chips?: { label: string; accent: Accent }[];
  /** Colour bar along the bottom edge; one segment per accent. */
  bar: Accent[];
};

export function renderOgImage({ eyebrow, title, tagline, accent, artwork, chips, bar }: OgImageProps) {
  const host = new URL(SITE_URL).host;
  const icon = pngDataUri("brand/app-icon.png");
  // Long names wrap onto two lines; shrink them a little so they still fit.
  const titleSize = title.length > 11 ? 84 : 100;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: COLOR.brand900,
          backgroundImage: `linear-gradient(135deg, ${COLOR.ink} 0%, ${COLOR.brand900} 55%, ${COLOR.brand700} 100%)`,
          color: COLOR.white,
          fontFamily: "Nunito Sans",
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "56px 64px 48px 72px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              height: "100%",
              paddingRight: 48,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: COLOR.white,
                  marginRight: 16,
                }}
              >
                <img src={icon} width={46} height={46} alt="" />
              </div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>EzyAgric</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: COLOR.brand100 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: ACCENT_HEX[accent],
                    marginRight: 12,
                  }}
                />
                {eyebrow}
              </div>
              <div
                style={{
                  fontSize: titleSize,
                  fontWeight: 800,
                  lineHeight: 1.02,
                  letterSpacing: -2,
                  marginTop: 12,
                  textWrap: "balance",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 40,
                  lineHeight: 1.25,
                  color: COLOR.brand100,
                  marginTop: 18,
                  textWrap: "balance",
                }}
              >
                {tagline}
              </div>
            </div>

            {chips?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {chips.map((chip) => (
                  <div
                    key={chip.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: 24,
                      fontWeight: 800,
                      padding: "8px 18px",
                      marginRight: 10,
                      marginTop: 10,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.12)",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: ACCENT_HEX[chip.accent],
                        marginRight: 10,
                      }}
                    />
                    {chip.label}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 26, color: COLOR.brand100 }}>{host}</div>
            )}
          </div>

          <Artwork artwork={artwork} accent={accent} />
        </div>

        <div style={{ display: "flex", height: 14 }}>
          {bar.map((a, i) => (
            <div key={`${a}-${i}`} style={{ flex: 1, backgroundColor: ACCENT_HEX[a] }} />
          ))}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Nunito Sans", data: readAsset("fonts/NunitoSans-Regular.ttf"), weight: 400, style: "normal" },
        { name: "Nunito Sans", data: readAsset("fonts/NunitoSans-ExtraBold.ttf"), weight: 800, style: "normal" },
      ],
    },
  );
}
