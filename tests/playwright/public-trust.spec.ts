import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, gotoAndHydrate, isVisible, tour } from "./support/ui";

test.describe("marketing trust hub", () => {
  test("trust route acts as compact hub instead of duplicating safety content", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/trust");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    await expect(page.getByRole("heading", { level: 1, name: "Wohin Sie für welche Trust-Frage gehen sollten" })).toBeVisible();
    await expect(tour(page, "trust-architecture-map")).toBeVisible();
    await expect(tour(page, "trust-public-artifacts")).toBeVisible();
    await expect(tour(page, "trust-public-artifacts").locator('[data-tour="public-trust-artifact-card"]')).toHaveCount(7);
    await expect(tour(page, "trust-hub-sections")).toBeVisible();
    await expect(tour(page, "trust-hub-sections").getByRole("link", { name: "Prüfpfad öffnen" })).toHaveAttribute(
      "href",
      "/sicherheit",
    );
    await expect(tour(page, "trust-hub-sections").getByRole("link", { name: "Dokument öffnen" })).toHaveAttribute(
      "href",
      "/datenschutz",
    );
    await expect(tour(page, "trust-hub-sections").getByRole("link", { name: "Anbieterliste öffnen" })).toHaveAttribute(
      "href",
      "/unterauftragsverarbeiter",
    );
    await expect(tour(page, "trust-hub-sections").locator('a[href^="/app/"]')).toHaveCount(0);
    await expect(tour(page, "trust-hub-quick-checks")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
