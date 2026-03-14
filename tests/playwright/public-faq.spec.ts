import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, gotoAndHydrate, isVisible, tour } from "./support/ui";

test.describe("marketing faq", () => {
  test("faq page answers first and routes later", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/faq");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    await expect(page.getByRole("heading", { level: 1, name: /Häufige Fragen zu Advaic/i })).toBeVisible();
    await expect(tour(page, "marketing-faq-section")).toBeVisible();
    await expect(tour(page, "marketing-faq-answers")).toBeVisible();
    await expect(tour(page, "marketing-faq-answers")).toContainText("Sendet Advaic automatisch?");
    await expect(tour(page, "marketing-faq-answers")).toContainText("Ja, wenn Autopilot aktiv ist");

    const faqBox = await tour(page, "marketing-faq-section").boundingBox();
    const treeBox = await tour(page, "marketing-faq-tree").boundingBox();
    expect(faqBox).not.toBeNull();
    expect(treeBox).not.toBeNull();
    expect(faqBox!.y).toBeLessThan(600);
    expect(treeBox!.y).toBeGreaterThan(faqBox!.y + 220);

    await tour(page, "marketing-faq-deepdives").scrollIntoViewIfNeeded();
    await expect(tour(page, "marketing-faq-deepdives")).toContainText("Die vier wichtigsten Detailseiten");
    await expectNoHorizontalOverflow(page);
  });
});
