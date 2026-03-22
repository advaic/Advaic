import { expect, test } from "@playwright/test";

import { gotoAndHydrate, isVisible, tour } from "./support/ui";

test.describe("marketing roi", () => {
  test("roi inputs can be cleared and retyped without min-clamping on each keystroke", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/roi-rechner");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    const minutenInput = page.getByLabel("Minuten pro Anfrage (heute)");
    await minutenInput.fill("");
    await expect(minutenInput).toHaveValue("");
    await minutenInput.type("15");
    await expect(minutenInput).toHaveValue("15");
    await minutenInput.blur();
    await expect(minutenInput).toHaveValue("15");
  });

  test("empty roi inputs fall back to the configured minimum on blur", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/roi-rechner");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    const minutenInput = page.getByLabel("Minuten pro Anfrage (heute)");
    await minutenInput.fill("");
    await expect(minutenInput).toHaveValue("");
    await minutenInput.blur();
    await expect(minutenInput).toHaveValue("2");
  });

  test("optional conversion scenario can be expanded and edited", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndHydrate(page, "/roi-rechner");

    const cookieBanner = tour(page, "marketing-cookie-banner");
    if (await isVisible(cookieBanner)) {
      await page.getByRole("button", { name: "Nur notwendige" }).click();
      await expect(cookieBanner).toHaveCount(0);
    }

    await page.getByRole("button", { name: "Szenario einblenden" }).click();
    const besichtigungsquoteInput = page.getByLabel("Heutige Anfrage-zu-Besichtigung-Quote (%)");
    await expect(besichtigungsquoteInput).toHaveValue("13");
    await besichtigungsquoteInput.fill("");
    await besichtigungsquoteInput.type("17");
    await besichtigungsquoteInput.blur();
    await expect(besichtigungsquoteInput).toHaveValue("17");
    await expect(page.getByText("Optionales Umsatzszenario/Monat")).toBeVisible();
  });
});
