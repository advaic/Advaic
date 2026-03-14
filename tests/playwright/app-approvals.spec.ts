import { expect, test } from "@playwright/test";

import {
  authSkipReason,
  authStorageState,
  hasAuthStorageState,
} from "./support/auth";
import {
  expectBillingUpgradeGate,
  coreReviewViewports,
  expectNoHorizontalOverflow,
  expectTextContrast,
  expectTouchTarget,
  gotoAndHydrate,
  isVisible,
  tour,
  withinTour,
} from "./support/ui";

test.use({ storageState: authStorageState });

test.describe("app approvals", () => {
  test.skip(!hasAuthStorageState, authSkipReason);

  test("desktop approval inbox stays triageable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/zur-freigabe");

    if (await expectBillingUpgradeGate(page, "/app/zur-freigabe")) {
      await expectNoHorizontalOverflow(page);
      return;
    }

    await expect(tour(page, "approval-page")).toBeVisible();
    await expect(tour(page, "approval-header")).toBeVisible();
    await expect(tour(page, "approval-search")).toBeVisible();
    await expect(tour(page, "approval-bulk-actions")).toBeVisible();
    await expect(tour(page, "approval-triage-stats")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (await isVisible(tour(page, "approval-empty"))) {
      await expect(tour(page, "approval-empty")).toBeVisible();
      return;
    }

    const firstCard = tour(page, "approval-card").first();
    await expect(firstCard).toBeVisible();
    await expect(withinTour(firstCard, "approval-review-order")).toBeVisible();
    await expect(withinTour(firstCard, "approval-original")).toBeVisible();
    await expect(withinTour(firstCard, "approval-proposal")).toBeVisible();
    await expect(withinTour(firstCard, "approval-changes")).toBeVisible();
    await expect(withinTour(firstCard, "approval-decision")).toBeVisible();
    await expect(withinTour(firstCard, "approval-reason-block")).toBeVisible();
    await expect(withinTour(firstCard, "approval-send")).toBeVisible();
    await expect(withinTour(firstCard, "approval-edit")).toBeVisible();
    await expect(withinTour(firstCard, "approval-reject")).toBeVisible();
  });

  test("approval edit flow opens and closes cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoAndHydrate(page, "/app/zur-freigabe");

    if (await expectBillingUpgradeGate(page, "/app/zur-freigabe")) {
      await expectNoHorizontalOverflow(page);
      return;
    }

    if (await isVisible(tour(page, "approval-empty"))) {
      await expect(tour(page, "approval-empty")).toBeVisible();
      return;
    }

    const firstCard = tour(page, "approval-card").first();
    await withinTour(firstCard, "approval-edit").click();
    await expect(withinTour(firstCard, "approval-proposal")).toBeVisible();
    await expect(withinTour(firstCard, "approval-changes")).toBeVisible();
    await expect(withinTour(firstCard, "approval-decision")).toBeVisible();
    await expect(withinTour(firstCard, "approval-editor")).toBeVisible();
    await withinTour(firstCard, "approval-editor-cancel").click();
    await expect(withinTour(firstCard, "approval-editor")).toBeHidden();
  });

  for (const viewport of coreReviewViewports) {
    test(`${viewport.label}px approval inbox remains usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndHydrate(page, "/app/zur-freigabe");

      if (viewport.compactApp) {
        await expect(tour(page, "app-mobile-header")).toBeVisible();
      } else {
        await expect(tour(page, "app-chrome-bar")).toBeVisible();
      }

      if (await expectBillingUpgradeGate(page, "/app/zur-freigabe")) {
        await expectNoHorizontalOverflow(page);
        return;
      }

      await expect(tour(page, "approval-header")).toBeVisible();
      await expect(tour(page, "approval-search")).toBeVisible();
      if (viewport.compactApp) {
        await expect(tour(page, "approval-mobile-workbar")).toBeVisible();
        await expect(tour(page, "approval-mobile-triage")).toBeVisible();
      } else {
        await expect(tour(page, "approval-bulk-actions")).toBeVisible();
        await expect(tour(page, "approval-triage-stats")).toBeVisible();
      }
      if (!(await isVisible(tour(page, "approval-empty")))) {
        const firstCard = tour(page, "approval-card").first();
        if (viewport.compactApp) {
          const cardBox = await firstCard.boundingBox();
          expect(cardBox?.y ?? Infinity).toBeLessThan(viewport.height * 0.98);
          await tour(page, "approval-mobile-tools-toggle").click();
          await expect(tour(page, "approval-bulk-actions")).toBeVisible();
        }
        await expectTouchTarget(withinTour(firstCard, "approval-send"));
        await expectTouchTarget(withinTour(firstCard, "approval-edit"));
        await expectTextContrast(withinTour(firstCard, "approval-send"));
        await expectTextContrast(withinTour(firstCard, "approval-edit"));
      } else if (viewport.compactApp) {
        await tour(page, "approval-mobile-tools-toggle").click();
        await expect(tour(page, "approval-bulk-actions")).toBeVisible();
      }
      await expectNoHorizontalOverflow(page);
    });
  }
});
