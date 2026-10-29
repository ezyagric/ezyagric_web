import type { NextConfig } from "next";

// `npm run dev` serves its scripts only to pages opened at "localhost": opened
// at http://127.0.0.1:3000 (or [::1]), the computer's network address (192.168.x.x) or
// its .local name, the page shows but nothing on it works (the Ka-Ezy demo,
// menus, FAQ buttons). These are the addresses people open it at on their
// own machine or network; DEV_ORIGINS adds others, comma-separated
// (DEV_ORIGINS=myhost.example npm run dev). Development only: the exported
// site in out/ never uses it.
const PRIVATE_NETWORK = [
  "127.0.0.1",
  "[::1]",
  "*.local",
  "10.*.*.*",
  "192.168.*.*",
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
];
const extraOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// The site is exported as plain static files (out/) and served by nginx.
// Server-only features (redirects, headers, rewrites, image optimisation)
// do not work with `output: "export"`; they live in nginx/nginx.conf instead.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: [...PRIVATE_NETWORK, ...extraOrigins],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
