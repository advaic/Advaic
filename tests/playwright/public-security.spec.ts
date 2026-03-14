import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, gotoAndHydrate, isVisible, tour } from "./support/ui";

test.describe("marketing security page", () => {
  test("/sicherheit acts like a check page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/sicherheit");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    await expect(
      page.getByRole("heading", { level: 1, name: "So prüfen Makler sichere Anfrage-Automatisierung" }),
    ).toBeVisible();
    await expect(tour(page, "security-page-toc")).toBeVisible();
    await expect(tour(page, "security-review-sequence")).toBeVisible();
    await expect(tour(page, "security-review-sequence").locator("article")).toHaveCount(4);
    await expect(tour(page, "security-auto-manual")).toBeVisible();
    await expect(tour(page, "security-vendor-checklist")).toBeVisible();
    await expect(tour(page, "security-evidence-sources")).toBeVisible();
    await expect(tour(page, "security-detail-links")).toBeVisible();
    await expect(
      tour(page, "security-sidebar-evidence").getByRole("link", { name: "Regelwerk prüfen" }),
    ).toHaveAttribute("href", "/autopilot-regeln");
    await expectNoHorizontalOverflow(page);
  });
});
