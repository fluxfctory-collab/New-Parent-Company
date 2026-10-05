import { defineConfig, devices } from "@playwright/test";

// Runs against the production build (`npm test` builds first, then serves dist/).
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
