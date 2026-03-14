import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "@playwright/test";

const workspaceRoot = process.cwd();
const loopsDir = path.join(workspaceRoot, "public", "loops");
const baseUrl = process.env.POSTER_BASE_URL || "http://127.0.0.1:4010";
const shellSelector = '[data-tour="marketing-demo-shell"]';
const scale = process.env.POSTER_CAPTURE_SCALE || "0.91";

const captureTargets = [
  { output: "inbox.jpg", route: "/demo/inbox" },
  { output: "rules.jpg", route: "/demo/rules" },
  { output: "checks.jpg", route: "/demo/checks" },
  { output: "approve.jpg", route: "/demo/approve" },
  { output: "product-hero.jpg", route: "/demo/product-hero" },
  { output: "tour-inbox.jpg", route: "/demo/tour/1-inbox" },
  { output: "tour-rules.jpg", route: "/demo/tour/2-rules" },
  { output: "tour-checks.jpg", route: "/demo/tour/3-checks" },
  { output: "tour-log.jpg", route: "/demo/tour/4-log" },
];

async function main() {
  await fs.access(loopsDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1640, height: 960 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });

  try {
    for (const target of captureTargets) {
      const outputPath = path.join(loopsDir, target.output);
      const targetUrl = new URL(target.route, baseUrl);
      targetUrl.searchParams.set("clean", "1");
      targetUrl.searchParams.set("scale", scale);

      const response = await page.goto(targetUrl.toString(), { waitUntil: "domcontentloaded" });
      if (!response?.ok()) {
        throw new Error(`Could not load ${targetUrl.toString()} (${response?.status() || "no response"})`);
      }

      await page.waitForSelector(shellSelector, { state: "visible", timeout: 15_000 });
      await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => {});
      await page.waitForTimeout(250);

      await page.locator(shellSelector).screenshot({
        path: outputPath,
        type: "jpeg",
        quality: 88,
      });

      console.log(`generated ${path.relative(workspaceRoot, outputPath)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
