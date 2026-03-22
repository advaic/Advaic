import { chromium } from "@playwright/test";

const targetUrl = process.env.BANNER_URL || "http://127.0.0.1:4010/brand/advaic-linkedin-company-banner.svg";
const outputPath =
  process.env.BANNER_OUT || "public/brand/advaic-linkedin-company-banner.png";
const width = Number(process.env.BANNER_WIDTH || 1128);
const height = Number(process.env.BANNER_HEIGHT || 191);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
});

await page.goto(targetUrl, { waitUntil: "networkidle" });
await page.screenshot({ path: outputPath });
await browser.close();

console.log(`Banner rendered to ${outputPath}`);
