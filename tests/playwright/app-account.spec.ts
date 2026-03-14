import { expect, test } from "@playwright/test";

import {
  authSkipReason,
  authStorageState,
  hasAuthStorageState,
} from "./support/auth";
import {
  expectNoHorizontalOverflow,
  gotoAndHydrate,
  tour,
} from "./support/ui";

test.use({ storageState: authStorageState });

test.describe("app account", () => {
  test.skip(!hasAuthStorageState, authSkipReason);

  test("desktop account overview keeps the shared page header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/konto");

    await expect(tour(page, "app-chrome-title")).toHaveText("Konto");
    await expect(tour(page, "account-page")).toBeVisible();
    await expect(tour(page, "account-page-header")).toBeVisible();
    await expect(tour(page, "account-header")).toBeVisible();
    await expect(tour(page, "account-change-plan")).toBeVisible();
    await expect(tour(page, "account-personal-data")).toBeVisible();
    await expect(tour(page, "account-notifications")).toBeVisible();
    await expect(tour(page, "account-overview-cards")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("mobile account overview keeps the shared page header", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndHydrate(page, "/app/konto");

    await expect(tour(page, "app-mobile-header")).toBeVisible();
    await expect(tour(page, "app-mobile-header-title")).toHaveText("Konto");
    await expect(tour(page, "account-page")).toBeVisible();
    await expect(tour(page, "account-page-header")).toBeVisible();
    await expect(tour(page, "account-header")).toBeVisible();
    await expect(tour(page, "account-overview-cards")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("desktop billing page keeps the shared account settings structure", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/konto/abo");

    await expect(tour(page, "app-chrome-title")).toHaveText("Abo & Zahlungen");
    await expect(tour(page, "account-billing-page")).toBeVisible();
    await expect(tour(page, "account-billing-header")).toBeVisible();
    await expect(tour(page, "account-billing-stats")).toBeVisible();
    await expect(tour(page, "account-billing-plan-card")).toBeVisible();
    await expect(tour(page, "account-billing-actions")).toBeVisible();
    await expect(tour(page, "account-billing-invoices")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("desktop notifications page keeps the shared settings save pattern", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/benachrichtigungen");

    await expect(tour(page, "app-chrome-title")).toHaveText("Benachrichtigungen");
    await expect(tour(page, "notifications-page")).toBeVisible();
    await expect(tour(page, "notifications-header")).toBeVisible();
    await expect(tour(page, "notifications-stats")).toBeVisible();
    await expect(tour(page, "notifications-types")).toBeVisible();
    await expect(tour(page, "notifications-summary")).toBeVisible();
    await expect(tour(page, "notifications-save")).toBeVisible();
    await expect(tour(page, "notifications-save-bottom")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("mobile notifications page keeps the shared settings shell", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndHydrate(page, "/app/benachrichtigungen");

    await expect(tour(page, "app-mobile-header")).toBeVisible();
    await expect(tour(page, "app-mobile-header-title")).toHaveText("Benachrichtigungen");
    await expect(tour(page, "notifications-page")).toBeVisible();
    await expect(tour(page, "notifications-header")).toBeVisible();
    await expect(tour(page, "notifications-channels")).toBeVisible();
    await expect(tour(page, "notifications-save-bottom")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
