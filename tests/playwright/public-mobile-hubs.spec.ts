import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, gotoAndHydrate, isVisible, tour } from "./support/ui";

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const cookieBanner = tour(page, "marketing-cookie-banner");
  if (await isVisible(cookieBanner)) {
    await page.getByRole("button", { name: "Nur notwendige" }).click();
    await expect(cookieBanner).toHaveCount(0);
  }
}

async function openMobileHub(page: import("@playwright/test").Page, path: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoAndHydrate(page, path);
  await dismissCookieBanner(page);
}

test.describe("public hubs mobile compression", () => {
  test("/faq exposes quick answers earlier on mobile", async ({ page }) => {
    await openMobileHub(page, "/faq");

    const quickbar = tour(page, "faq-mobile-quickbar");
    await expect(quickbar).toBeVisible();
    await expect(tour(page, "marketing-faq-tree")).toBeHidden();
    await expect(quickbar.getByRole("link", { name: "Top-8-Antworten" })).toHaveAttribute("href", "#faq-answers");
    const quickbarBox = await quickbar.boundingBox();
    expect(quickbarBox).not.toBeNull();
    expect(quickbarBox!.y).toBeLessThan(720);
    await expect(tour(page, "faq-mobile-followup")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("/branchen shows fast jump paths on mobile", async ({ page }) => {
    await openMobileHub(page, "/branchen");

    const quickbar = tour(page, "branchen-mobile-quickbar");
    await expect(quickbar).toBeVisible();
    await expect(quickbar.getByRole("link", { name: "Markt-Matrix" })).toHaveAttribute(
      "href",
      "#branchen-market-matrix",
    );
    const quickbarBox = await quickbar.boundingBox();
    expect(quickbarBox).not.toBeNull();
    expect(quickbarBox!.y).toBeLessThan(720);
    await expect(tour(page, "branchen-profile-grid")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("/use-cases keeps routing and condensed checklist early on mobile", async ({ page }) => {
    await openMobileHub(page, "/use-cases");

    const quickbar = tour(page, "use-cases-mobile-quickbar");
    await expect(quickbar).toBeVisible();
    await expect(quickbar.getByRole("link", { name: "Routing prüfen" })).toHaveAttribute(
      "href",
      "#use-cases-routing",
    );
    const quickbarBox = await quickbar.boundingBox();
    expect(quickbarBox).not.toBeNull();
    expect(quickbarBox!.y).toBeLessThan(720);
    await expect(tour(page, "use-cases-mobile-checklist")).toBeVisible();
    await expect(tour(page, "use-cases-mobile-checklist").locator("li")).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
  });

  test("/integrationen prioritizes proof and comparison on mobile", async ({ page }) => {
    await openMobileHub(page, "/integrationen");

    const quickbar = tour(page, "integrations-mobile-quickbar");
    await expect(quickbar).toBeVisible();
    await expect(quickbar.getByRole("link", { name: "Produktbeweis" })).toHaveAttribute(
      "href",
      "#integrations-proof",
    );
    const quickbarBox = await quickbar.boundingBox();
    expect(quickbarBox).not.toBeNull();
    expect(quickbarBox!.y).toBeLessThan(720);
    await expect(tour(page, "integrations-comparison-table")).toBeVisible();
    await expect(tour(page, "integrations-detail-grid")).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });

  test("/sicherheit removes duplicated navigation on mobile", async ({ page }) => {
    await openMobileHub(page, "/sicherheit");

    const quickbar = tour(page, "security-mobile-quickbar");
    await expect(quickbar).toBeVisible();
    await expect(quickbar.getByRole("link", { name: "Prüfpfad öffnen" })).toHaveAttribute("href", "#pruefpfad");
    const quickbarBox = await quickbar.boundingBox();
    expect(quickbarBox).not.toBeNull();
    expect(quickbarBox!.y).toBeLessThan(720);
    await expect(tour(page, "security-page-toc")).toBeHidden();
    await expect(tour(page, "security-sidebar-toc")).toBeHidden();
    await expect(tour(page, "security-sidebar-evidence")).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
});
