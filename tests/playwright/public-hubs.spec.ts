import { expect, test } from "@playwright/test";

import { gotoAndHydrate, tour } from "./support/ui";

test.describe("marketing hubs", () => {
  test("/branchen uses a distinct market-fit layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/branchen");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Welche Markt- und Teamprofile am besten zu Advaic passen",
    );
    await expect(tour(page, "branchen-fit-canvas")).toBeVisible();
    await expect(tour(page, "branchen-market-matrix")).toBeVisible();
    await expect(tour(page, "branchen-profile-grid")).toBeVisible();
    await expect(tour(page, "branchen-profile-grid").locator("article")).toHaveCount(3);
  });

  test("/use-cases uses an operational routing layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/use-cases");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Für welche Makler-Setups Advaic besonders sinnvoll ist",
    );
    await expect(tour(page, "use-cases-routing-board")).toBeVisible();
    await expect(tour(page, "use-cases-routing-lane")).toHaveCount(4);
    await expect(tour(page, "use-cases-routing-visual")).toBeVisible();
    await expect(tour(page, "use-cases-case-grid")).toBeVisible();
    await expect(tour(page, "use-cases-checklist")).toBeVisible();
  });
});
