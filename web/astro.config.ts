import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// GitHub Pages project site: https://akabekobeko.github.io/parade/
// (docs/specs/web/architecture/deploy.md). Internal links and asset paths
// must be prefixed with `import.meta.env.BASE_URL` or built through the
// `astro:i18n` helpers, which already include the base.
export default defineConfig({
  site: "https://akabekobeko.github.io",
  base: "/parade",
  output: "static",
  // Pages are emitted as `<route>/index.html`, so a trailing slash is the
  // URL GitHub Pages serves without a redirect. Keep generated links in that
  // form.
  trailingSlash: "always",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    // sitemap-index.xml with hreflang alternates per page
    // (docs/specs/web/architecture/i18n.md). The integration leaves the
    // 404 page out by itself.
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", ja: "ja" },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
