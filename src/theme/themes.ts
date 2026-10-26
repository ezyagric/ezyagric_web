// Names of the themes defined in src/theme/themes.css. content/site.yaml
// picks one with `theme:`; the build fails if it names a theme not listed here.
export const THEMES = ["ezyagric", "ezyagric-guide"] as const;
export type ThemeName = (typeof THEMES)[number];
