/**
 * On Render we use @sparticuz/chromium (downloaded with npm) — skip Puppeteer's full Chrome download.
 * Locally, install Chrome for Testing so full `puppeteer` launch works.
 */
const { execSync } = require("child_process");

if (process.env.RENDER === "true" || process.env.USE_SPARTICUZ_CHROMIUM === "1") {
  console.log("[postinstall] Skipping puppeteer browsers install (Render / Sparticuz Chromium).");
  process.exit(0);
}

try {
  execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
} catch (e) {
  console.warn("[postinstall] puppeteer browsers install failed (optional for local dev):", e.message);
}
