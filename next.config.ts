// A5: Security Headers

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },                          // kein iframe-Embedding (Clickjacking)
        { key: "X-Content-Type-Options", value: "nosniff" },                 // kein MIME-Type-Raten
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }, // erzwingt HTTPS
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" } // nur eigene Scripts/Styles
      ]
    }
  ],
  productionBrowserSourceMaps: false // Source Maps in Production aus → Code nicht einsehbar
};

export default nextConfig;
