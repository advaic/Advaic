import { expect, test } from "@playwright/test";

import {
  authSkipReason,
  authStorageState,
  hasAuthStorageState,
} from "./support/auth";
import {
  expectVisibleFocus,
  coreReviewViewports,
  expectNoHorizontalOverflow,
  expectSticky,
  expectTextContrast,
  expectTouchTarget,
  gotoAndHydrate,
  tabUntilFocused,
  tour,
} from "./support/ui";

test.use({ storageState: authStorageState });

test.describe("app dashboard", () => {
  test.skip(!hasAuthStorageState, authSkipReason);

  test("desktop dashboard top area stays scannable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/startseite");

    await expect(tour(page, "sidebar-automation-status")).toBeVisible();
    await expect(tour(page, "sidebar-section-heute")).toBeVisible();
    await expect(tour(page, "sidebar-section-kommunikation")).toBeVisible();
    await expect(tour(page, "sidebar-section-system")).toBeVisible();
    await expect(tour(page, "sidebar-section-einstellungen")).toBeVisible();
    await expect(tour(page, "app-chrome-bar")).toBeVisible();
    await expect(tour(page, "app-chrome-title")).toHaveText("Startseite");
    await expect(tour(page, "home-hero")).toBeVisible();
    await expectSticky(tour(page, "home-hero"));
    await expect(tour(page, "dashboard-quickstart")).toBeVisible();
    await expect(tour(page, "home-stats-desktop")).toBeVisible();
    await expect(tour(page, "dashboard-system-health")).toBeVisible();
    await expect(tour(page, "dashboard-automation-control")).toBeVisible();
    await expect(tour(page, "home-shortcuts")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  for (const viewport of coreReviewViewports) {
    test(`${viewport.label}px dashboard shell remains usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndHydrate(page, "/app/startseite");

      if (viewport.compactApp) {
        await expect(tour(page, "app-mobile-header")).toBeVisible();
        await expect(tour(page, "app-mobile-header-title")).toHaveText("Startseite");
        await expectTouchTarget(tour(page, "app-mobile-nav-toggle"));
      } else {
        await expect(tour(page, "app-chrome-bar")).toBeVisible();
        await expect(tour(page, "app-chrome-title")).toHaveText("Startseite");
      }

      await expect(tour(page, "home-hero")).toBeVisible();
      await expect(tour(page, "dashboard-quickstart")).toBeVisible();
      await expect(
        tour(page, viewport.compactApp ? "home-stats" : "home-stats-desktop"),
      ).toBeVisible();
      await expect(tour(page, "dashboard-system-health")).toBeVisible();
      if (viewport.compactApp) {
        const statsBox = await tour(page, "home-stats").boundingBox();
        expect(statsBox).not.toBeNull();
        expect(statsBox!.y).toBeLessThan(viewport.height * 0.95);
      }
      const statsTour = tour(
        page,
        viewport.compactApp ? "home-stats" : "home-stats-desktop",
      );
      await expectTextContrast(statsTour.locator(".app-text-meta-label").first());
      await expectTextContrast(statsTour.locator(".app-text-helper").first());
      await expectNoHorizontalOverflow(page);
    });
  }

  test("mobile app chrome keeps keyboard focus sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndHydrate(page, "/app/startseite");

    const mobileToggle = tour(page, "app-mobile-nav-toggle");
    await tabUntilFocused(page, mobileToggle, 8);
    await expectVisibleFocus(mobileToggle);

    await page.keyboard.press("Enter");
    await expect(tour(page, "sidebar")).toBeVisible();
    await expect(tour(page, "sidebar-automation-status")).toBeVisible();
    await expect(tour(page, "sidebar-section-heute")).toBeVisible();
    await expect(tour(page, "sidebar-section-system")).toBeVisible();
    await expect(tour(page, "sidebar-footer")).toBeVisible();

    const logout = tour(page, "logout");
    await tabUntilFocused(page, logout, 24);
    await expectVisibleFocus(logout);
  });
});
