import { expect, test } from "@playwright/test";

import {
  authSkipReason,
  authStorageState,
  hasAuthStorageState,
  leadId,
  leadSkipReason,
} from "./support/auth";
import {
  expectBillingUpgradeGate,
  coreReviewViewports,
  expectNoHorizontalOverflow,
  expectSticky,
  expectTextContrast,
  expectTouchTarget,
  gotoAndHydrate,
  tour,
} from "./support/ui";

test.use({ storageState: authStorageState });

test.describe("app conversation detail", () => {
  test.skip(!hasAuthStorageState, authSkipReason);
  test.skip(!leadId, leadSkipReason);

  test("desktop conversation shell and composer stay stable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, `/app/nachrichten/${leadId}`);

    if (await expectBillingUpgradeGate(page, `/app/nachrichten/${leadId}`)) {
      await expectNoHorizontalOverflow(page);
      return;
    }

    await expect(tour(page, "conversation-panel")).toBeVisible();
    await expectSticky(tour(page, "conversation-header"));
    await expect(tour(page, "conversation-context-summary")).toBeVisible();
    await expect(tour(page, "conversation-escalation-summary")).toBeVisible();
    await expect(tour(page, "conversation-action-bar")).toBeVisible();
    await expect(tour(page, "conversation-thread-card")).toBeVisible();
    await expect(tour(page, "conversation-messages")).toBeVisible();
    await expect(tour(page, "composer")).toBeVisible();
    await expect(tour(page, "composer-textarea")).toBeVisible();
    await expect(tour(page, "send-button")).toBeVisible();
    await expect(tour(page, "lead-copilot-card")).toBeVisible();
    await expect(tour(page, "conversation-context-rail")).toBeVisible();
    await expect(tour(page, "conversation-escalation-card")).toBeVisible();
    await expect(tour(page, "conversation-property-card")).toBeVisible();
    await expect(tour(page, "conversation-followups-card")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("profile drawer and property modal open cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoAndHydrate(page, `/app/nachrichten/${leadId}`);

    if (await expectBillingUpgradeGate(page, `/app/nachrichten/${leadId}`)) {
      await expectNoHorizontalOverflow(page);
      return;
    }

    await tour(page, "lead-profile-button").click();
    await expect(tour(page, "profile-drawer")).toBeVisible();
    await page.getByRole("button", { name: "Schließen" }).first().click();
    await expect(tour(page, "profile-drawer")).toBeHidden();

    await expect(tour(page, "conversation-property-manage")).toBeVisible();
    await tour(page, "conversation-property-manage").click();
    await expect(tour(page, "conversation-property-modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tour(page, "conversation-property-modal")).toBeHidden();
  });

  for (const viewport of coreReviewViewports) {
    test(`${viewport.label}px conversation shell remains usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndHydrate(page, `/app/nachrichten/${leadId}`);

      if (viewport.compactApp) {
        await expect(tour(page, "app-mobile-header")).toBeVisible();
      } else {
        await expect(tour(page, "app-chrome-bar")).toBeVisible();
      }

      if (await expectBillingUpgradeGate(page, `/app/nachrichten/${leadId}`)) {
        await expectNoHorizontalOverflow(page);
        return;
      }

      await expect(tour(page, "conversation-header")).toBeVisible();
      if (viewport.compactApp) {
        await expect(tour(page, "conversation-mobile-workbar")).toBeVisible();
        const threadCard = tour(page, "conversation-thread-card");
        const threadBox = await threadCard.boundingBox();
        expect(threadBox?.y ?? Infinity).toBeLessThan(viewport.height * 0.98);

        await tour(page, "conversation-mobile-context-toggle").click();
        await expect(tour(page, "conversation-context-summary")).toBeVisible();
        await expect(tour(page, "conversation-escalation-summary")).toBeVisible();

        await tour(page, "conversation-mobile-actions-toggle").click();
        await expect(tour(page, "conversation-action-bar")).toBeVisible();
      } else {
        await expect(tour(page, "conversation-context-summary")).toBeVisible();
        await expect(tour(page, "conversation-escalation-summary")).toBeVisible();
        await expect(tour(page, "conversation-action-bar")).toBeVisible();
      }
      await expect(tour(page, "composer")).toBeVisible();
      await expect(tour(page, "composer-textarea")).toBeVisible();
      await expectTouchTarget(tour(page, "send-button"));
      await expectTextContrast(tour(page, "conversation-context-summary").locator(".app-text-helper").first());
      await expectTextContrast(tour(page, "send-button"));
      await expectNoHorizontalOverflow(page);
    });
  }
});
