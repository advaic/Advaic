import { expect, type Locator, type Page } from "@playwright/test";

export const coreReviewViewports = [
  { label: "390", width: 390, height: 844, compactApp: true },
  { label: "430", width: 430, height: 932, compactApp: true },
  { label: "768", width: 768, height: 1024, compactApp: false },
] as const;

export function tour(page: Page, name: string): Locator {
  return page.locator(`[data-tour="${name}"]`);
}

export function withinTour(locator: Locator, name: string): Locator {
  return locator.locator(`[data-tour="${name}"]`);
}

export async function gotoAndHydrate(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 2_500 }).catch(() => {});
  await page.waitForTimeout(150);
}

export async function expectBillingUpgradeGate(page: Page, expectedNext?: string) {
  const url = new URL(page.url());
  if (url.pathname !== "/app/konto/abo") return false;

  if (expectedNext) {
    expect(url.searchParams.get("next")).toBe(expectedNext);
  }

  await expect(page.locator('div[data-tour="account-link-abozahlungen"]').first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Abo & Zahlungen" })).toBeVisible();
  await expect(page.getByText("Starter erforderlich").first()).toBeVisible();
  return true;
}

export async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
    ),
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

export async function expectSticky(locator: Locator) {
  await expect(locator).toBeVisible();
  const position = await locator.evaluate((node) => {
    return window.getComputedStyle(node).position;
  });

  expect(["sticky", "fixed"]).toContain(position);
}

export async function isVisible(locator: Locator) {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
}

export async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 24) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    try {
      await expect(locator).toBeFocused({ timeout: 250 });
      return;
    } catch {
      // keep tabbing until the requested element receives focus
    }
  }

  throw new Error(`Konnte Fokus nicht innerhalb von ${maxTabs} Tabs auf das Ziel bewegen.`);
}

export async function expectVisibleFocus(locator: Locator) {
  await expect(locator).toBeFocused();

  const styles = await locator.evaluate((node) => {
    const computed = window.getComputedStyle(node as HTMLElement);
    return {
      boxShadow: computed.boxShadow,
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
    };
  });

  const hasBoxShadow = !!styles.boxShadow && styles.boxShadow !== "none";
  const hasOutline =
    styles.outlineStyle !== "none" && styles.outlineWidth !== "0px";

  expect(hasBoxShadow || hasOutline).toBeTruthy();
}

export async function expectTouchTarget(
  locator: Locator,
  minimum = 44,
) {
  await expect(locator).toBeVisible();

  const box = await locator.evaluate((node) => {
    const rect = (node as HTMLElement).getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  });

  expect(box.width).toBeGreaterThanOrEqual(minimum);
  expect(box.height).toBeGreaterThanOrEqual(minimum);
}

export async function expectTextContrast(
  locator: Locator,
  minimum = 4.5,
) {
  await expect(locator).toBeVisible();

  const ratio = await locator.evaluate((node) => {
    const parseColor = (value: string) => {
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) return { r: 255, g: 255, b: 255, a: 1 };
      const parts = match[1]
        .split(",")
        .map((part) => Number.parseFloat(part.trim()))
        .filter((part) => Number.isFinite(part));

      return {
        r: parts[0] ?? 255,
        g: parts[1] ?? 255,
        b: parts[2] ?? 255,
        a: parts[3] ?? 1,
      };
    };

    const composite = (
      foreground: { r: number; g: number; b: number; a: number },
      background: { r: number; g: number; b: number; a: number },
    ) => {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };

      return {
        r:
          (foreground.r * foreground.a +
            background.r * background.a * (1 - foreground.a)) /
          alpha,
        g:
          (foreground.g * foreground.a +
            background.g * background.a * (1 - foreground.a)) /
          alpha,
        b:
          (foreground.b * foreground.a +
            background.b * background.a * (1 - foreground.a)) /
          alpha,
        a: alpha,
      };
    };

    const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };

      return (
        0.2126 * channel(r) +
        0.7152 * channel(g) +
        0.0722 * channel(b)
      );
    };

    const contrast = (
      foreground: { r: number; g: number; b: number },
      background: { r: number; g: number; b: number },
    ) => {
      const l1 = luminance(foreground);
      const l2 = luminance(background);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const backgroundLayers: HTMLElement[] = [];
    let current: HTMLElement | null = node as HTMLElement;
    while (current) {
      backgroundLayers.unshift(current);
      current = current.parentElement;
    }

    let background = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of backgroundLayers) {
      const color = parseColor(window.getComputedStyle(layer).backgroundColor);
      if (color.a > 0) {
        background = composite(color, background);
      }
    }

    const text = parseColor(window.getComputedStyle(node as HTMLElement).color);
    const textOnBackground = composite(text, background);
    return contrast(textOnBackground, background);
  });

  expect(ratio).toBeGreaterThanOrEqual(minimum);
}

export async function expectStaticAssetsOk(page: Page, assetPaths: string[]) {
  const results = await page.evaluate(async (paths) => {
    const uniquePaths = Array.from(new Set(paths));

    return Promise.all(
      uniquePaths.map(async (assetPath) => {
        const response = await fetch(assetPath, { cache: "no-store" });
        return {
          assetPath,
          ok: response.ok,
          status: response.status,
        };
      }),
    );
  }, assetPaths);

  for (const result of results) {
    expect(result.ok, `${result.assetPath} should resolve successfully (status ${result.status})`).toBeTruthy();
  }
}

export function firstToken(text: string | null | undefined) {
  const token = String(text || "").trim().split(/\s+/).find(Boolean) || "test";
  return token.slice(0, 24);
}
