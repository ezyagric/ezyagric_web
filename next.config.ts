import type { NextConfig } from "next";

// The site is exported as plain static files (out/) and served by nginx.
// Server-only features (redirects, headers, rewrites, image optimisation)
// do not work with `output: "export"`; they live in nginx/nginx.conf instead.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
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
