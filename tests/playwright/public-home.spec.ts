import { expect, test } from "@playwright/test";

import {
  coreReviewViewports,
  expectNoHorizontalOverflow,
  expectStaticAssetsOk,
  expectSticky,
  expectTextContrast,
  expectTouchTarget,
  gotoAndHydrate,
  isVisible,
  tour,
} from "./support/ui";

test.describe("marketing home", () => {
  test("desktop hero and navbar stay stable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/");

    const hero = page.locator("#top");
    const navbar = tour(page, "marketing-navbar");

    await expect(navbar).toBeVisible();
    await expectSticky(navbar);
    await expect(navbar.getByRole("link", { name: "Produkt", exact: true })).toBeVisible();
    await expect(navbar.getByRole("link", { name: "Preise", exact: true })).toBeVisible();
    await expect(
      navbar.getByRole("link", { name: "14 Tage testen", exact: true }),
    ).toBeVisible();
    await expect(tour(page, "marketing-nav-secondary-toggle")).toBeVisible();
    await tour(page, "marketing-nav-secondary-toggle").click();
    await expect(tour(page, "marketing-nav-secondary-panel")).toBeVisible();
    await expect(tour(page, "marketing-nav-secondary-panel").getByRole("link", { name: "FAQ" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(tour(page, "marketing-hero-primary-cta")).toBeVisible();
    await expect(tour(page, "marketing-hero-primary-cta")).toHaveText("14 Tage testen");
    await expectTextContrast(tour(page, "marketing-hero-primary-cta"));
    await expect(tour(page, "marketing-hero-proof-cta")).toBeVisible();
    await expect(tour(page, "marketing-hero-proof-summary")).toBeVisible();
    await expect(tour(page, "marketing-hero-visual")).toBeVisible();
    await expect(tour(page, "marketing-hero-main-shot")).toBeVisible();
    await expect(tour(page, "marketing-hero-proofstrip")).toBeVisible();
    await expect(tour(page, "marketing-proof-block")).toBeVisible();
    await expect(tour(page, "marketing-proof-main")).toBeVisible();
    await expect(tour(page, "marketing-proof-step")).toHaveCount(2);
    await expect(tour(page, "marketing-trust-block")).toBeVisible();
    await expect(tour(page, "marketing-trust-artifacts")).toBeVisible();
    await expect(tour(page, "marketing-trust-artifacts").locator('[data-tour="public-trust-artifact-card"]')).toHaveCount(4);
    await expect(tour(page, "marketing-trust-limit")).toHaveCount(3);
    await expect(tour(page, "marketing-footer")).toBeVisible();
    await expect(tour(page, "marketing-footer-groups")).toBeVisible();
    await expect(tour(page, "marketing-footer-group")).toHaveCount(4);
    await expectTextContrast(tour(page, "marketing-trust-block").locator(".section-kicker").first());
    await expectTextContrast(tour(page, "marketing-trust-limit").first());
    await expectStaticAssetsOk(page, [
      "/loops/product-hero.jpg",
      "/loops/tour-inbox.jpg",
      "/loops/tour-rules.jpg",
      "/loops/tour-checks.jpg",
    ]);
    await expectNoHorizontalOverflow(page);
  });

  for (const viewport of coreReviewViewports) {
    test(`${viewport.label}px drawer menu opens and closes cleanly`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndHydrate(page, "/");
      const navbar = tour(page, "marketing-navbar");
      const cookieBanner = tour(page, "marketing-cookie-banner");

      if (await isVisible(cookieBanner)) {
        await expect(cookieBanner).toBeVisible();
        await expect(tour(page, "marketing-mobile-conversion-bar")).toHaveCount(0);
        await expect(tour(page, "marketing-assistant-launcher")).toHaveCount(0);
        await page.getByRole("button", { name: "Nur notwendige" }).click();
        await expect(cookieBanner).toHaveCount(0);
      }

      if (viewport.width < 768) {
        await expect(tour(page, "marketing-cookie-settings-button")).toHaveCount(0);
        await expect(tour(page, "marketing-assistant-launcher")).toHaveCount(0);
        await expect(tour(page, "marketing-mobile-conversion-bar")).toBeVisible();
        const heroShotBox = await tour(page, "marketing-hero-main-shot").boundingBox();
        expect(heroShotBox).not.toBeNull();
        expect(heroShotBox!.y).toBeLessThan(viewport.height * 0.9);
      } else {
        await expect(tour(page, "marketing-mobile-conversion-bar")).toBeHidden();
      }

      await expect(tour(page, "marketing-nav-toggle")).toBeVisible();
      await expectTouchTarget(tour(page, "marketing-nav-toggle"));
      await tour(page, "marketing-nav-toggle").click();
      await expect(tour(page, "marketing-nav-toggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(tour(page, "marketing-nav-mobile-drawer")).toBeVisible();
      await expect(tour(page, "marketing-nav-mobile-primary")).toBeVisible();
      await expect(tour(page, "marketing-nav-mobile-secondary")).toBeVisible();
      await expect(tour(page, "marketing-nav-mobile-secondary").getByRole("link", { name: "FAQ" })).toBeVisible();
      await expect(
        navbar.getByRole("link", { name: "14 Tage testen", exact: true }),
      ).toBeVisible();
      await expectTouchTarget(
        tour(page, "marketing-nav-mobile-drawer").getByRole("link", {
          name: "14 Tage testen",
          exact: true,
        }),
      );
      await expect(navbar.getByRole("link", { name: "Login", exact: true })).toBeVisible();

      await tour(page, "marketing-nav-toggle").click();
      await expect(tour(page, "marketing-nav-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expectNoHorizontalOverflow(page);
    });
  }
});
