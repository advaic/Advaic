const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4010").replace(/\/$/, "");

const routeChecks = [
  {
    path: "/",
    markers: [
      "Immobilienanfragen automatisch beantworten | Advaic",
      "14 Tage testen",
    ],
  },
  {
    path: "/produkt",
    markers: [
      "Produkt: Auto-Antworten mit Freigabe und Qualitätschecks",
      "So entscheidet Advaic im echten Ablauf.",
    ],
  },
  {
    path: "/preise",
    markers: [
      "Preise: 199 € pro 4 Wochen nach 14 Tagen Testphase",
      "14 Tage im echten Betrieb. Danach Starter.",
    ],
  },
  {
    path: "/so-funktionierts",
    markers: [
      "So funktioniert's | Advaic",
      "So funktioniert Advaic Schritt für Schritt",
    ],
  },
  {
    path: "/sicherheit",
    markers: [
      "Sichere Anfrage-Automatisierung für Makler",
      "So prüfen Makler sichere Anfrage-Automatisierung",
    ],
  },
  {
    path: "/faq",
    markers: [
      "FAQ | Advaic",
      "Häufige Fragen zu Advaic",
    ],
  },
  {
    path: "/use-cases",
    markers: [
      "Anwendungsfälle | Advaic",
      "Welche Nachricht wohin gehört",
    ],
  },
  {
    path: "/integrationen",
    markers: [
      "Integrationen | Advaic",
      "Postfach-Integrationen für den produktiven Betrieb",
    ],
  },
  {
    path: "/trust",
    markers: [
      "Trust-Hub | Advaic",
      "Wohin Sie für welche Trust-Frage gehen sollten",
    ],
  },
  {
    path: "/unterauftragsverarbeiter",
    markers: [
      "Unterauftragsverarbeiter | Advaic",
      "Unterauftragsverarbeiter",
    ],
  },
  {
    path: "/nutzungsbedingungen",
    markers: [
      "Nutzungsbedingungen (B2B) | Advaic",
      "Nutzungsbedingungen (B2B)",
    ],
  },
  {
    path: "/roi-rechner",
    markers: [
      "ROI-Rechner für Makler: Zeitgewinn realistisch bewerten",
      "Zeitgewinn und Reaktionsgeschwindigkeit realistisch berechnen",
    ],
  },
  {
    path: "/branchen",
    markers: [
      "Branchenprofile | Advaic",
      "Welche Marktlogik den sicheren Start bestimmt",
    ],
  },
  {
    path: "/datenschutz",
    markers: [
      "Datenschutzhinweise | Advaic",
      "Datenschutzhinweise",
    ],
  },
  {
    path: "/cookie-und-storage",
    markers: [
      "Cookie &amp; Storage | Advaic",
      "Welche Cookies und Browser-Speicher wir nutzen",
    ],
  },
];

async function requestHtml(path) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: "text/html" },
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.cause instanceof Error
          ? `${error.message}: ${error.cause.message}`
          : error.message
        : String(error);
    throw new Error(`GET ${path}: ${reason}`);
  }

  const text = await response.text();
  return { status: response.status, text };
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label}: expected marker "${needle}"`);
  }
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected status ${expected}, got ${actual}`);
  }
}

async function main() {
  for (const route of routeChecks) {
    const label = `GET ${route.path}`;
    const { status, text } = await requestHtml(route.path);
    assertStatus(status, 200, label);

    for (const marker of route.markers) {
      assertIncludes(text, marker, label);
    }

    console.log(`OK ${route.path}`);
  }

  console.log("Public route smoke passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
