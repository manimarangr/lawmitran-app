import type { NextConfig } from "next";

/**
 * Location SEO — short root city URLs 301 to the canonical city hub
 * (/bangalore → /lawyers/bengaluru). Canonical pages keep the "lawyers"
 * keyword in the URL; aliases cover common alternate city names.
 * See docs/24-seo-and-landing-pages.md.
 */
const CITY_SLUGS = [
  "bengaluru",
  "chennai",
  "mumbai",
  "delhi",
  "hyderabad",
  "pune",
  "kolkata",
  "kochi",
];

const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  bombay: "mumbai",
  madras: "chennai",
  calcutta: "kolkata",
  cochin: "kochi",
  "new-delhi": "delhi",
};

const isDev = process.env.NODE_ENV === "development";

// Dev talks to the backend on a separate origin (localhost:3001); in prod
// nginx proxies /api same-origin (docker/nginx/nginx.conf), so 'self' covers
// it there and this just adds a redundant-but-harmless entry.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").origin;
  } catch {
    return "";
  }
})();

// Third-party origins actually loaded by the app: Google Fonts (layout.tsx),
// Google Maps JS API (lawyer search map, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
// reCAPTCHA (components/ui/Captcha.tsx). Local MinIO is dev-only — prod
// storage is same-origin under /storage (docker/nginx/nginx.conf).
const CSP = [
  `default-src 'self'`,
  // 'unsafe-inline' is required for Next.js's own hydration scripts (no nonce
  // wired up — that needs proxy.ts + dynamic rendering, which would disable
  // static generation on the SEO-critical public pages). 'unsafe-eval' is
  // dev-only, for React's dev-mode error reconstruction.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.google.com https://www.gstatic.com https://maps.googleapis.com`,
  // Google Maps sets inline style="" attributes on generated map elements,
  // which needs 'unsafe-inline' too (a nonce doesn't cover style attributes).
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com${isDev ? " http://localhost:9000" : ""}`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `connect-src 'self' https://maps.googleapis.com${apiOrigin && apiOrigin !== "null" ? ` ${apiOrigin}` : ""}`,
  `frame-src https://www.google.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ');

const nextConfig: NextConfig = {
  images: {
    // Local dev serves profile/office photos straight from MinIO on this
    // origin (S3_PUBLIC_URL is unset locally — see backend storage.service.ts).
    // Deployed envs proxy storage same-origin under /storage (docker/nginx/nginx.conf),
    // so no remote pattern is needed there.
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/lawmitran-documents/**",
      },
    ],
    // `next start`'s image optimizer refuses upstream hosts that resolve to a
    // loopback/private IP by default (SSRF guard) — "localhost" always does,
    // so local MinIO needs this explicit opt-in. Only affects the one host/path
    // allow-listed above; deployed envs never hit this path (same-origin /storage).
    dangerouslyAllowLocalIP: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=15552000; includeSubDomains",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // /bengaluru → /lawyers/bengaluru
      ...CITY_SLUGS.map((city) => ({
        source: `/${city}`,
        destination: `/lawyers/${city}`,
        permanent: true,
      })),
      // /bangalore → /lawyers/bengaluru (alias → canonical slug)
      ...Object.entries(CITY_ALIASES).map(([alias, city]) => ({
        source: `/${alias}`,
        destination: `/lawyers/${city}`,
        permanent: true,
      })),
      // aliases under /lawyers too: /lawyers/bangalore → /lawyers/bengaluru
      ...Object.entries(CITY_ALIASES).map(([alias, city]) => ({
        source: `/lawyers/${alias}`,
        destination: `/lawyers/${city}`,
        permanent: true,
      })),
      // and for city×practice: /lawyers/bangalore/family-law → /lawyers/bengaluru/family-law
      ...Object.entries(CITY_ALIASES).map(([alias, city]) => ({
        source: `/lawyers/${alias}/:area`,
        destination: `/lawyers/${city}/:area`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
