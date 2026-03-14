import { expect, test } from "@playwright/test";

import {
  authSkipReason,
  authStorageState,
  hasAuthStorageState,
} from "./support/auth";
import {
  expectNoHorizontalOverflow,
  expectTextContrast,
  expectTouchTarget,
  gotoAndHydrate,
  tour,
} from "./support/ui";

test.use({ storageState: authStorageState });

test.describe("app tone style", () => {
  test.skip(!hasAuthStorageState, authSkipReason);

  test("desktop tone & style page feels like setup instead of a raw form", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/ton-und-stil");

    await expect(tour(page, "app-chrome-bar")).toBeVisible();
    await expect(tour(page, "app-chrome-title")).toHaveText("Ton & Stil");
    await expect(tour(page, "tone-style-page")).toBeVisible();
    await expect(tour(page, "tone-style-header")).toBeVisible();
    await expect(tour(page, "tone-style-card")).toBeVisible();
    await expect(tour(page, "tone-style-selector")).toBeVisible();
    await expect(tour(page, "tone-style-rules-text")).toBeVisible();
    await expect(tour(page, "tone-style-formulations-input")).toBeVisible();
    await expect(tour(page, "tone-style-preview-card")).toBeVisible();
    await expect(tour(page, "tone-style-preview-summary")).toBeVisible();
    await expect(tour(page, "tone-style-save")).toBeVisible();
    await expect(tour(page, "tone-style-bottom-save")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("mobile tone & style page keeps setup, inputs and preview usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndHydrate(page, "/app/ton-und-stil");

    await expect(tour(page, "app-mobile-header")).toBeVisible();
    await expect(tour(page, "app-mobile-header-title")).toHaveText("Ton & Stil");
    await expect(tour(page, "tone-style-page")).toBeVisible();
    await expect(tour(page, "tone-style-header")).toBeVisible();
    await expect(tour(page, "tone-style-card")).toBeVisible();
    await expect(tour(page, "tone-style-formulations-add")).toBeVisible();
    await expectTouchTarget(tour(page, "tone-style-formulations-add"));
    await expectTextContrast(tour(page, "tone-style-formulations-add"));

    await tour(page, "tone-style-preview-card").scrollIntoViewIfNeeded();
    await expect(tour(page, "tone-style-preview-card")).toBeVisible();
    await expect(tour(page, "tone-style-preview-hint")).toBeVisible();
    await expectTextContrast(tour(page, "tone-style-preview-hint"));
    await expect(tour(page, "tone-style-bottom-save-btn")).toBeVisible();
    await expectTouchTarget(tour(page, "tone-style-bottom-save-btn"));
    await expectTextContrast(tour(page, "tone-style-bottom-save-btn"));
    await expectNoHorizontalOverflow(page);
  });
});
