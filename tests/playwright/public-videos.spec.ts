import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, expectStaticAssetsOk, gotoAndHydrate, tour } from "./support/ui";

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const necessaryButton = page.getByRole("button", { name: "Nur notwendige" });
  if (await necessaryButton.isVisible().catch(() => false)) {
    await necessaryButton.click();
  }
}

test.describe("marketing video production suite", () => {
  test("video gallery and detail view stay stable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/demo?view=videos");
    await dismissCookieBanner(page);

    await expect(page.getByRole("heading", { level: 1, name: "Video-Produktionssuite" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Wie Advaic im Tagesgeschäft arbeitet" })).toBeVisible();

    await page.getByRole("link", { name: "Vorschau" }).first().click();

    await expect(tour(page, "marketing-video-player")).toBeVisible();
    await expect(tour(page, "marketing-video-title")).toBeVisible();
    await expect(tour(page, "marketing-video-scene")).toBeVisible();
    await expect(tour(page, "marketing-video-overlay")).toBeVisible();
    await expect(tour(page, "marketing-video-caption")).toBeVisible();
    await expect(tour(page, "marketing-video-progress")).toBeVisible();
    await expect(tour(page, "marketing-video-scene-tab")).toHaveCount(10);
    await expect(tour(page, "marketing-video-downloads")).toBeVisible();
    await expectStaticAssetsOk(page, [
      "/videos/posters/tagesgeschaeft.png",
      "/videos/captions/tagesgeschaeft.vtt",
      "/videos/audio/tagesgeschaeft.m4a",
    ]);
    await expectNoHorizontalOverflow(page);
  });

  test("clean record view renders without chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoAndHydrate(page, "/demo?view=videos&id=auto-vs-freigabe&clean=1&autoplay=1");

    await expect(tour(page, "marketing-video-player")).toBeVisible();
    await expect(tour(page, "marketing-video-scene")).toBeVisible();
    await expect(tour(page, "marketing-video-caption")).toBeVisible();
    await expect(page.getByText("Produktionsdateien")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  for (const route of [
    "/demo/tagesgeschaeft",
    "/demo/auto-vs-freigabe",
    "/demo/qualitaetschecks-followups",
  ]) {
    test(`${route} renders a full watch page`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoAndHydrate(page, route);
      await dismissCookieBanner(page);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(tour(page, "video-watch-player")).toBeVisible();
      await expect(tour(page, "marketing-video-player")).toBeVisible();
      await expect(tour(page, "marketing-video-inline-controls")).toBeVisible();
      await expect(tour(page, "video-watch-chapters")).toBeVisible();
      await expect(tour(page, "video-watch-transcript")).toBeVisible();
      await expect(tour(page, "video-watch-related")).toBeVisible();
      await expect(tour(page, "video-watch-cta-row")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});
