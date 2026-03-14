import { expect, test } from "@playwright/test";

import {
  coreReviewViewports,
  expectNoHorizontalOverflow,
  expectStaticAssetsOk,
  expectTouchTarget,
  gotoAndHydrate,
  isVisible,
  tour,
} from "./support/ui";

test.describe("marketing product", () => {
  test("product video poster assets resolve", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/produkt");

    await expectStaticAssetsOk(page, [
      "/loops/product-hero.jpg",
      "/marketing-screenshots/core/raw/approval-review-flow.png",
      "/marketing-screenshots/core/raw/approval-decision.png",
      "/loops/tour-inbox.jpg",
      "/loops/tour-rules.jpg",
      "/loops/tour-checks.jpg",
      "/loops/tour-log.jpg",
    ]);
  });

  test("desktop product page stays focused on core flow and approval proof", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/produkt");

    await expect(tour(page, "produkt-hero-visual")).toBeVisible();
    await expect(tour(page, "produkt-hero-main-shot")).toBeVisible();
    await expect(tour(page, "produkt-hero-proofcards")).toBeVisible();

    await tour(page, "produkt-approval-visual").scrollIntoViewIfNeeded();
    await expect(tour(page, "produkt-approval-main-shot")).toBeVisible();
    await expect(tour(page, "produkt-approval-secondary-shot")).toBeVisible();
    await tour(page, "produkt-trust-block").scrollIntoViewIfNeeded();
    await expect(tour(page, "produkt-trust-block")).toBeVisible();
    await expect(tour(page, "produkt-trust-artifacts")).toBeVisible();
    await expect(tour(page, "produkt-trust-artifacts").locator('[data-tour="public-trust-artifact-card"]')).toHaveCount(4);
    await expect(tour(page, "marketing-public-benchmark")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
  });

  for (const viewport of coreReviewViewports) {
    test(`${viewport.label}px product hero remains scanbar`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndHydrate(page, "/produkt");
      const cookieBanner = tour(page, "marketing-cookie-banner");

      if (await isVisible(cookieBanner)) {
        await expect(cookieBanner).toBeVisible();
        await expect(tour(page, "marketing-mobile-conversion-bar")).toHaveCount(0);
        await expect(tour(page, "marketing-assistant-launcher")).toHaveCount(0);
        await page.getByRole("button", { name: "Nur notwendige" }).click();
        await expect(cookieBanner).toHaveCount(0);
      }

      await expect(tour(page, "marketing-navbar")).toBeVisible();
      await expect(tour(page, "produkt-hero")).toBeVisible();
      if (viewport.width < 768) {
        await expect(tour(page, "marketing-cookie-settings-button")).toHaveCount(0);
        await expect(tour(page, "marketing-assistant-launcher")).toHaveCount(0);
        await expect(tour(page, "marketing-mobile-conversion-bar")).toBeVisible();
        const heroShotBox = await tour(page, "produkt-hero-main-shot").boundingBox();
        expect(heroShotBox).not.toBeNull();
        expect(heroShotBox!.y).toBeLessThan(viewport.height * 0.95);
      } else {
        await expect(tour(page, "marketing-mobile-conversion-bar")).toBeHidden();
      }
    await expect(tour(page, "produkt-hero-primary-cta")).toBeVisible();
    await expectTouchTarget(tour(page, "produkt-hero-primary-cta"));
    await expect(tour(page, "produkt-hero-quickanchors")).toBeVisible();
    await expect(tour(page, "produkt-hero-quickanchors").locator("a")).toHaveCount(5);
    await expectTouchTarget(tour(page, "produkt-hero-quickanchors").locator("a").first());
    await expect(tour(page, "produkt-hero-trustchips")).toBeVisible();
      await expect(tour(page, "produkt-hero-visual")).toBeVisible();
      await expect(tour(page, "produkt-hero-main-shot")).toBeVisible();
      await tour(page, "produkt-approval-visual").scrollIntoViewIfNeeded();
      await expect(tour(page, "produkt-approval-main-shot")).toBeVisible();
      await tour(page, "produkt-trust-block").scrollIntoViewIfNeeded();
      await expect(tour(page, "produkt-trust-block")).toBeVisible();
      await expect(tour(page, "produkt-trust-artifacts")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});
