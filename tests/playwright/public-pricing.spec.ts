import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, gotoAndHydrate, isVisible, tour } from "./support/ui";

test.describe("marketing pricing", () => {
  test("pricing page shows the public starter price clearly", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/preise");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    await expect(page.getByRole("heading", { level: 1, name: /199 € pro 4 Wochen/i })).toBeVisible();
    await expect(tour(page, "pricing-price-summary")).toContainText("199 € pro 4 Wochen");
    await expect(tour(page, "marketing-pricing-price")).toContainText("199 €");
    await expect(tour(page, "marketing-pricing-price")).toContainText("pro 4 Wochen");
    await expect(tour(page, "pricing-objection-card")).toBeVisible();
    await expect(tour(page, "pricing-objection-card")).toContainText(
      "Wir wollen nicht sofort blind automatisieren",
    );
    await expectNoHorizontalOverflow(page);
  });

  test("homepage pricing section shows the same public starter price", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    await tour(page, "marketing-pricing-price").scrollIntoViewIfNeeded();
    await expect(tour(page, "marketing-pricing-price")).toContainText("199 €");
    await expect(tour(page, "marketing-pricing-price")).toContainText("pro 4 Wochen");
    await expectNoHorizontalOverflow(page);
  });
});
