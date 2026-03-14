import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, gotoAndHydrate, isVisible, tour } from "./support/ui";

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const cookieBanner = tour(page, "marketing-cookie-banner");
  if (await isVisible(cookieBanner)) {
    await page.getByRole("button", { name: "Nur notwendige" }).click();
    await expect(cookieBanner).toHaveCount(0);
  }
}

test("/integrationen compares Gmail and Outlook as public options", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoAndHydrate(page, "/integrationen");
  await dismissCookieBanner(page);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gmail und Outlook im direkten Vergleich" })).toBeVisible();
  await expect(tour(page, "integrations-proof-section")).toBeVisible();
  await expect(tour(page, "integrations-proof-card")).toHaveCount(3);
  const comparisonTable = tour(page, "integrations-comparison-table");
  await expect(comparisonTable).toBeVisible();
  await expect(comparisonTable.getByText("Setup", { exact: true }).first()).toBeVisible();
  await expect(comparisonTable.getByText("OAuth / Verbindung", { exact: true }).first()).toBeVisible();
  await expect(comparisonTable.getByText("Versandpfad", { exact: true }).first()).toBeVisible();
  await expect(comparisonTable.getByText("Go-Live-Checks", { exact: true }).first()).toBeVisible();
  await expect(page.locator('a[href="/integrationen/gmail"]')).toHaveCount(4);
  await expect(page.locator('a[href="/integrationen/outlook"]')).toHaveCount(4);
  await expect(page.locator('a[href^="/app/"]')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

for (const route of ["/integrationen/gmail", "/integrationen/outlook"]) {
  test(`${route} keeps public visitors on public paths`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, route);
    await dismissCookieBanner(page);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href^="/app/"]')).toHaveCount(0);
    await expect(tour(page, "integration-detail-proof")).toBeVisible();
    await expect(page.getByRole("link", { name: "Setup ansehen" })).toHaveAttribute(
      "href",
      "/produkt#setup",
    );
    await expect(page.getByRole("link", { name: /Mit (Gmail|Outlook) testen/ })).toHaveAttribute(
      "href",
      new RegExp("^/signup\\?entry=integrationen-"),
    );
    await expect(
      tour(page, route.includes("gmail") ? "integration-gmail-checks" : "integration-outlook-checks"),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
