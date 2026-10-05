import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dev-only: render the page on the server for every HTML request, so `npm run dev`
 * shows the same static markup the production build ships (no client rendering).
 * Production HTML is produced by scripts/prerender.mjs after `vite build --ssr`.
 */
function ssrDev(): Plugin {
  return {
    name: "guardian-ssr-dev",
    apply: "serve",
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.originalUrl ?? "/";
          if (!(url === "/" || url.startsWith("/?") || url === "/index.html")) return next();
          try {
            const template = await server.transformIndexHtml(
              url,
              readFileSync(path.resolve(import.meta.dirname, "index.html"), "utf8"),
            );
            const { render } = await server.ssrLoadModule("/src/entry-server.tsx");
            const html = template.replace("<!--app-html-->", render());
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
          } catch (e) {
            server.ssrFixStacktrace(e as Error);
            next(e);
          }
        });
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), ssrDev()],
  build: {
    assetsInlineLimit: 0,
    ssrEmitAssets: true,
  },
});
