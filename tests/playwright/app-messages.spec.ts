import { expect, test } from "@playwright/test";

import {
  authSkipReason,
  authStorageState,
  hasAuthStorageState,
} from "./support/auth";
import {
  expectBillingUpgradeGate,
  expectVisibleFocus,
  coreReviewViewports,
  expectNoHorizontalOverflow,
  expectSticky,
  expectTextContrast,
  expectTouchTarget,
  firstToken,
  gotoAndHydrate,
  isVisible,
  tabUntilFocused,
  tour,
  withinTour,
} from "./support/ui";

test.use({ storageState: authStorageState });

test.describe("app messages", () => {
  test.skip(!hasAuthStorageState, authSkipReason);

  test("desktop filters and list stay stable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/nachrichten");

    await expect(tour(page, "app-chrome-bar")).toBeVisible();
    if (await expectBillingUpgradeGate(page, "/app/nachrichten")) {
      await expect(tour(page, "app-chrome-title")).toHaveText("Abo & Zahlungen");
      await expectNoHorizontalOverflow(page);
      return;
    }

    await expect(tour(page, "app-chrome-title")).toHaveText("Nachrichten");
    await expect(tour(page, "messages-page")).toBeVisible();
    await expectSticky(tour(page, "messages-header"));
    await expect(tour(page, "messages-counts")).toBeVisible();
    await expect(tour(page, "messages-filters")).toBeVisible();
    await expect(tour(page, "messages-quickfilters")).toBeVisible();
    await expect(tour(page, "messages-inbox")).toBeVisible();
    await expect(tour(page, "messages-list")).toBeVisible();
    await expect(tour(page, "messages-bulkbar")).toBeVisible();
    await expect(tour(page, "messages-bulkbar-select-all")).toBeVisible();
    await expect(tour(page, "messages-scroll")).toBeVisible();
    await expect(tour(page, "messages-overflow-toggle")).toBeVisible();
    await expect(tour(page, "messages-chip-approval")).toBeVisible();
    await expect(tour(page, "messages-chip-escalation")).toBeVisible();
    await expect(tour(page, "messages-chip-high")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    if (await isVisible(tour(page, "messages-empty"))) {
      await expect(tour(page, "messages-empty")).toBeVisible();
      return;
    }

    const firstCard = tour(page, "conversation-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator("h2")).toBeVisible();
    await expect(withinTour(firstCard, "conversation-open")).toBeVisible();
    await expect(withinTour(firstCard, "conversation-overflow-toggle")).toBeVisible();
    await withinTour(firstCard, "conversation-overflow-toggle").click();
    await expect(withinTour(firstCard, "conversation-overflow-panel")).toBeVisible();

    const messagesScrollOverflowY = await tour(page, "messages-scroll").evaluate(
      (el) => getComputedStyle(el).overflowY,
    );
    expect(messagesScrollOverflowY).not.toBe("auto");
    expect(messagesScrollOverflowY).not.toBe("scroll");

    const bulkbarPosition = await tour(page, "messages-bulkbar").evaluate(
      (el) => getComputedStyle(el).position,
    );
    expect(bulkbarPosition).not.toBe("sticky");

    const query = firstToken(await firstCard.locator("h2").textContent());
    await tour(page, "messages-search-input").fill(query);
    await expect(tour(page, "conversation-card").first()).toBeVisible();
    await tour(page, "messages-bulkbar-select-all").click();
    await expect(tour(page, "messages-bulkbar-count")).toContainText("ausgewählt");
    await tour(page, "messages-bulkbar-clear").click();
    await tour(page, "messages-chip-high").click();
    await tour(page, "messages-overflow-toggle").click();
    await expect(tour(page, "messages-overflow-panel")).toBeVisible();
    await tour(page, "messages-reset-filters").click();
    await expect(tour(page, "messages-search-input")).toHaveValue("");
  });

  for (const viewport of coreReviewViewports) {
    test(`${viewport.label}px messages shell remains usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndHydrate(page, "/app/nachrichten");

      if (viewport.compactApp) {
        await expect(tour(page, "app-mobile-header")).toBeVisible();
        await expectTouchTarget(tour(page, "app-mobile-nav-toggle"));
      } else {
        await expect(tour(page, "app-chrome-bar")).toBeVisible();
      }

      if (await expectBillingUpgradeGate(page, "/app/nachrichten")) {
        if (viewport.compactApp) {
          await expect(tour(page, "app-mobile-header-title")).toHaveText("Abo & Zahlungen");
        } else {
          await expect(tour(page, "app-chrome-title")).toHaveText("Abo & Zahlungen");
        }
        await expectNoHorizontalOverflow(page);
        return;
      }

      if (viewport.compactApp) {
        await expect(tour(page, "app-mobile-header-title")).toHaveText("Nachrichten");
        await expect(tour(page, "messages-search-mobile")).toBeVisible();
        await expect(tour(page, "messages-overflow-toggle-mobile")).toBeVisible();
        await expectTouchTarget(tour(page, "messages-overflow-toggle-mobile"));
      } else {
        await expect(tour(page, "app-chrome-title")).toHaveText("Nachrichten");
        await expect(tour(page, "messages-search")).toBeVisible();
        await expect(tour(page, "messages-overflow-toggle")).toBeVisible();
      }

      await expect(tour(page, "messages-header")).toBeVisible();
      await expect(tour(page, "messages-quickfilters")).toBeVisible();
      await expectTouchTarget(tour(page, "messages-chip-approval"));
      await expectTextContrast(tour(page, "messages-chip-approval"));
      await expectTextContrast(tour(page, "messages-counts").locator("span").first());
      await expect(tour(page, "messages-inbox")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("desktop messages behalten sichtbare Keyboard-Fokuszustände", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/app/nachrichten");

    if (await expectBillingUpgradeGate(page, "/app/nachrichten")) {
      await expectNoHorizontalOverflow(page);
      return;
    }

    const searchInput = tour(page, "messages-search-input");
    await tabUntilFocused(page, searchInput, 20);
    await expectVisibleFocus(searchInput);

    const approvalChip = tour(page, "messages-chip-approval");
    await tabUntilFocused(page, approvalChip, 8);
    await expectVisibleFocus(approvalChip);

    await searchInput.fill("max");

    const overflowButton = tour(page, "messages-overflow-toggle");
    await tabUntilFocused(page, overflowButton, 8);
    await expectVisibleFocus(overflowButton);
    await page.keyboard.press("Enter");
    await expect(tour(page, "messages-overflow-panel")).toBeVisible();

    const resetButton = tour(page, "messages-reset-filters");
    await tabUntilFocused(page, resetButton, 8);
    await expectVisibleFocus(resetButton);

    if (await isVisible(tour(page, "conversation-card").first())) {
      const firstCard = tour(page, "conversation-card").first();
      await tabUntilFocused(page, firstCard, 12);
      await expectVisibleFocus(firstCard);
    }
  });
});
