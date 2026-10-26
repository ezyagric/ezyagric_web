import fs from "node:fs";
import path from "node:path";
import { getSite } from "@/lib/content";
import type { ThemeName } from "./themes";

// Build-time access to theme values for code that cannot use CSS variables:
// share images (Satori) and the browser theme-colour meta tag. Reads
// src/theme/themes.css, so the CSS file stays the single source of truth.

const CSS_FILE = path.join(process.cwd(), "src", "theme", "themes.css");

function parseBlocks(css: string): Map<string, Record<string, string>> {
  const blocks = new Map<string, Record<string, string>>();
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, selector, body] of withoutComments.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const vars: Record<string, string> = {};
    for (const [, name, value] of body.matchAll(/--theme-([\w-]+)\s*:\s*([^;]+);/g)) {
      vars[name] = value.trim();
    }
    for (const sel of selector.split(",").map((s) => s.trim())) {
      const theme = sel === ":root" ? ":root" : sel.match(/data-theme="([^"]+)"/)?.[1];
      if (theme) blocks.set(theme, { ...(blocks.get(theme) ?? {}), ...vars });
    }
  }
  return blocks;
}

let cache: Map<string, Record<string, string>> | undefined;

/** All --theme-* values for a theme (its overrides on top of the defaults). */
export function getThemeTokens(name: ThemeName = getSite().theme): Record<string, string> {
  cache ??= parseBlocks(fs.readFileSync(CSS_FILE, "utf8"));
  return { ...(cache.get(":root") ?? {}), ...(cache.get(name) ?? {}) };
}

/** One token as a plain value, e.g. themeToken("heading") -> "#05377e". */
export function themeToken(token: string, name?: ThemeName): string {
  const value = getThemeTokens(name)[token];
  if (!value) throw new Error(`src/theme/themes.css has no --theme-${token}`);
  return value;
}
