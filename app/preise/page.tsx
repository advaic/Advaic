"use client";

import { motion } from "framer-motion";
import FAQAccordion from "@/components/FAQAccordion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const faqItems = [
  {
    question: "Was ist in Advaic Pro enthalten?",
    answer:
      "Advaic Pro enthält alle Features – vollautomatisierte Antworten, Follow-Ups, Eskalationen, DSGVO-Sicherheit und mehr.",
  },
  {
    question: "Gibt es eine kostenlose Testphase?",
    answer:
      "Ja! Du kannst Advaic 14 Tage kostenlos testen – ganz ohne Verpflichtung.",
  },
  {
    question: "Kann ich jederzeit kündigen?",
    answer:
      "Natürlich. Es gibt keine Mindestvertragslaufzeit – du kannst monatlich kündigen.",
  },
  {
    question: "Warum nur ein Plan?",
    answer:
      "Klarheit und Einfachheit. Wir glauben, dass jeder Zugriff auf alle Features haben sollte, ohne versteckte Upgrades.",
  },
  {
    question: "Für wen ist Advaic gedacht?",
    answer:
      "Ideal für selbstständige Makler:innen und kleine Agenturen, die professionell auftreten und Zeit sparen wollen.",
  },
];

export default function PreisePage() {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const pricingRef = useRef<HTMLElement>(null);

  // State for calculator
  const [inquiries, setInquiries] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [savings, setSavings] = useState<number | null>(null);
  const [leadsRecovered, setLeadsRecovered] = useState<number | null>(null);
  // Zusatznutzen Felder
  const [abschlussrate, setAbschlussrate] = useState<string>(""); // Prozent, als String für optional
  const [wertProAbschluss, setWertProAbschluss] = useState<string>(""); // Euro, als String für optional
  const [zusatzgewinn, setZusatzgewinn] = useState<number | null>(null);

  useEffect(() => {
    function handleScroll() {
      if (!pricingRef.current) return;
      const pricingBottom = pricingRef.current.getBoundingClientRect().bottom;
      setShowStickyBar(pricingBottom < 0);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function calculateSavings() {
    // Assumptions:
    // Each inquiry takes approx 10 minutes manual handling without Advaic
    // Advaic automates 80% of inquiries, saving time
    // Leads recovered is 15% of lost leads without Advaic
    // Zusatznutzen: +15% mehr qualifizierte Leads, Abschlussrate & Wert pro Abschluss optional
    const minutesPerInquiry = 10;
    const automatedPercent = 0.8;
    const lostLeadPercent = 0.15;
    const zusatzLeadPercent = 0.15; // 15% mehr qualifizierte Leads

    const totalMinutesSaved = inquiries * minutesPerInquiry * automatedPercent;
    const totalHoursSaved = totalMinutesSaved / 60;
    const calculatedSavings = totalHoursSaved * hourlyRate;

    const estimatedLeadsRecovered = Math.round(inquiries * lostLeadPercent);

    setSavings(calculatedSavings);
    setLeadsRecovered(estimatedLeadsRecovered);

    // Zusatznutzen berechnen, falls beide Felder ausgefüllt
    if (
      abschlussrate.trim() !== "" &&
      wertProAbschluss.trim() !== "" &&
      !isNaN(Number(abschlussrate)) &&
      !isNaN(Number(wertProAbschluss))
    ) {
      const additionalLeads = Math.round(inquiries * zusatzLeadPercent);
      const abschlussrateDecimal = Number(abschlussrate) / 100;
      const wert = Number(wertProAbschluss);
      const abschlussAnzahl = additionalLeads * abschlussrateDecimal;
      const zusatz = abschlussAnzahl * wert;
      setZusatzgewinn(zusatz);
    } else {
      setZusatzgewinn(null);
    }
  }

  return (
    <>
      <main className="bg-gradient-to-b from-teal-50 via-purple-50 to-white pb-32 min-h-screen">
        {/* Hero */}
        <section className="text-center px-4 pt-20">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Premium-Funktionen.{" "}
            <span className="text-purple-600 underline decoration-purple-400 decoration-4 underline-offset-8">
              Klarer Preis.
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Ein Plan, alles drin. Keine versteckten Kosten. Starte mit unserer
            kostenlosen Testphase.
          </p>
        </section>

        {/* Pricing Columns */}
        <section
          ref={pricingRef}
          className="mt-24 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Free Trial */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              14 Tage kostenlos
            </h2>
            <p className="text-gray-500 text-sm mb-4">Starte ohne Risiko</p>
            <div className="text-4xl font-extrabold text-gray-900 mb-2">0€</div>
            <p className="text-sm text-gray-500 mb-6">
              Einfach loslegen – keine Kreditkarte nötig
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>✓ Automatisierte Antworten auf E-Mails</li>
              <li>✓ Persönlicher Kommunikationsstil</li>
              <li>✓ Reaktion innerhalb von Sekunden, rund um die Uhr</li>
              <li>✓ Zugriff auf alle Features ohne Einschränkungen</li>
              <li>✓ DSGVO-konforme Datenverarbeitung</li>
              <li>✓ Keine Kreditkarte erforderlich</li>
              <li>✓ Follow-Up-Automatisierung</li>
              <li>✓ Eskalationslogik bei wichtigen Anfragen</li>
              <li>✓ Basis-Dashboard zur Lead-Übersicht</li>
              <li>✓ Antwortvorschläge zur Nachbearbeitung</li>
              <li>✓ Tonalitätsanalyse pro Nachricht</li>
              <li>✓ Lead-Priorisierung (Hot/Warm/Cold)</li>
              <li>✓ Übersichtliche Zusammenfassungen jeder Konversation</li>
              <li>✓ Performance-Metriken für Nachrichtenqualität</li>
              <li>✓ Echtzeit-Testumgebung mit echtem E-Mail-Zugang</li>
              <li>✓ Inbox-Integration für Gmail/Outlook</li>
              <li>✓ Klare Übersicht über gesendete Antworten</li>
              <li>✓ Live-Support während der Testphase</li>
              <li>✓ Dynamisches Nachrichtentraining durch GPT</li>
              <li>✓ Auflistung offener, eskalierter und geschlossener Fälle</li>
            </ul>
            <button className="bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl">
              Jetzt starten
            </button>
            <p className="mt-4 text-center text-sm text-gray-500">
              Jeder Plan beginnt mit einer 14-tägigen kostenlosen Testphase.
            </p>
          </motion.div>

          {/* Launch Offer */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-yellow-50 rounded-3xl p-8 shadow-xl border-2 border-yellow-400 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Advaic Pro</h2>
            <p className="text-yellow-600 font-semibold mb-2">
              Nur für die ersten 5 Kunden
            </p>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              <span className="line-through text-gray-400 mr-2">499€</span>299€
            </div>
            <p className="text-sm text-gray-500 mb-6">
              pro Monat, jederzeit kündbar
            </p>
            <ul className="text-left text-sm text-gray-700 space-y-2 mb-6">
              <li>✓ Alles aus dem kostenlosen Test</li>
              <li>✓ Voller Zugriff auf die Plattform nach Testphase</li>
              <li>✓ Kontinuierliche Optimierung durch Feedback-Zyklus</li>
              <li>✓ Adaptive Follow-Up-Logik mit Zeitintervallen</li>
              <li>✓ Multi-Step Eskalationsprozesse</li>
              <li>✓ Erweiterte Lead-Datenanalyse</li>
              <li>✓ Persönliche Nachrichtenzusammenfassungen für jeden Kontakt</li>
              <li>✓ Vorschläge für nächste Schritte nach jeder Nachricht</li>
              <li>✓ Eigene Antwortvorlagen verwalten</li>
              <li>✓ Stimmungsanalyse mit Score (z. B. positiv/negativ)</li>
              <li>✓ Dashboard mit Filter-, Sortier- und Taggingfunktionen</li>
              <li>✓ Integration von Agentenfeedback zur GPT-Optimierung</li>
              <li>✓ Kontrollübersicht: Was der Bot wann sagt</li>
              <li>✓ Konversationen markieren, archivieren und exportieren</li>
              <li>✓ Aktivitätsprotokoll für DSGVO-Dokumentation</li>
              <li>✓ Automatische Erkennung von inaktiven Leads</li>
              <li>✓ Wiederaktivierungs-Strategien durch GPT</li>
              <li>✓ Schnellantwort-Vorlagen direkt im Dashboard</li>
              <li>✓ Trainingsdatenbank mit echten Beispielen</li>
              <li>✓ Persönlicher Setup-Support durch Gründerteam</li>
              <li>✓ Monatlich kündbar</li>
            </ul>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-xl shadow">
              Jetzt sichern
            </button>
            <p className="mt-4 text-center text-sm text-gray-500">
              Jeder Plan beginnt mit einer 14-tägigen kostenlosen Testphase.
            </p>
          </motion.div>

          {/* Upfront Deal */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Langfristiger Deal
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              Einmalzahlung + günstiger Monatsbeitrag
            </p>
            <div className="text-lg text-gray-900 font-medium mb-1">
              Einmal: 1.500€
            </div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">
              149€/Monat
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Ab dem 2. Monat – ideal für Vielnutzer
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
              <li>✓ Alles aus Advaic Pro</li>
              <li>✓ Deutlich reduzierter Monatsbeitrag ab Monat 2</li>
              <li>✓ Frühzeitiger Zugang zu neuen Features & Tools</li>
              <li>✓ Bevorzugter First-Line Support</li>
              <li>✓ Beratung zu optimalem Bot-Verhalten</li>
              <li>✓ Erweiterter Speicher für vergangene Konversationen</li>
              <li>✓ Eigene Branding-Optionen im Interface</li>
              <li>✓ Persönliches GPT-Modell-Training ab 6 Monaten Nutzung</li>
              <li>✓ Wunsch-Integrationen auf Anfrage (z. B. CRM)</li>
              <li>✓ Übersicht aller Interaktionen pro Lead</li>
              <li>✓ Optionaler PDF-Export der Kommunikation</li>
              <li>✓ Premium-Auswertungen über Lead-Performance</li>
              <li>✓ Monitoring von Konversionsraten</li>
              <li>✓ Feature-Voting für künftige Releases</li>
              <li>✓ Telefonischer Support nach Wunsch</li>
              <li>✓ Technischer SLA mit Antwortzeiten</li>
              <li>✓ Onboarding für ganze Teams möglich</li>
              <li>✓ API-Zugang zur Systemanbindung</li>
              <li>✓ Admin-Panel zur Nutzerverwaltung</li>
              <li>✓ Quartalsmäßiger Strategie-Check mit dem Team</li>
              <li>✓ Early-Access-Berechtigung bei Alpha-Features</li>
            </ul>
            <button className="bg-gray-900 text-white font-semibold py-2 px-4 rounded-xl">
              Mehr erfahren
            </button>
            <p className="mt-4 text-center text-sm text-gray-500">
              Jeder Plan beginnt mit einer 14-tägigen kostenlosen Testphase.
            </p>
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="mt-20 max-w-3xl mx-auto text-center px-4">
          <FAQAccordion items={faqItems} />
        </section>

        {/* Warum Advaic? */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-12 text-center">
            Warum Advaic?
          </h2>
          <div className="flex flex-col md:flex-row md:justify-center md:gap-20 gap-12 max-w-5xl mx-auto">
            {/* Left side: Premium copywriting */}
            <div className="md:w-1/2 space-y-8 text-gray-700 dark:text-gray-200 text-lg leading-relaxed">
              <div>
                <h3 className="font-semibold text-xl text-purple-700 mb-2">
                  Weniger Stress, mehr Abschlüsse
                </h3>
                <p>
                  Unsere KI übernimmt Ihre Leads rund um die Uhr, mit personalisiertem Ton und automatisierten Follow-ups – damit Sie sich auf das Wesentliche konzentrieren können.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-purple-700 mb-2">
                  Maximale Effizienz durch Automatisierung
                </h3>
                <p>
                  Sparen Sie wertvolle Zeit durch intelligente Eskalationen und smarte Lead-Priorisierung – für schnellere und bessere Entscheidungen.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-purple-700 mb-2">
                  DSGVO-konform & sicher
                </h3>
                <p>
                  Ihre Daten sind bei uns sicher. Transparente Prozesse und umfassende Dokumentation gewährleisten höchste Datenschutzstandards.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-purple-700 mb-2">
                  Persönlicher Stil, authentische Kommunikation
                </h3>
                <p>
                  Advaic spricht in Ihrem Ton – menschlich, ehrlich und überzeugend, ohne den Eindruck eines Chatbots.
                </p>
              </div>
            </div>

            {/* Right side: Comparison table */}
            <div className="md:w-1/2 bg-white dark:bg-neutral-900 shadow rounded-lg p-6 border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Mit vs. Ohne Advaic
              </h3>
              <table className="w-full text-left text-sm text-gray-800 dark:text-gray-200 border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="py-2 px-3 font-medium">Merkmal</th>
                    <th className="py-2 px-3 font-medium">Ohne Advaic</th>
                    <th className="py-2 px-3 font-medium">Mit Advaic</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-semibold">Reaktionszeit</td>
                    <td className="py-2 px-3">Langsam, manuell</td>
                    <td className="py-2 px-3">Sekundenschnell, automatisiert</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-semibold">Follow-up-System</td>
                    <td className="py-2 px-3">Kein oder unstrukturiert</td>
                    <td className="py-2 px-3">Intelligent & zeitgesteuert</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-semibold">Fehleranfälligkeit</td>
                    <td className="py-2 px-3">Hoch durch manuelle Bearbeitung</td>
                    <td className="py-2 px-3">Gering dank Automatisierung</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-semibold">Zeitaufwand</td>
                    <td className="py-2 px-3">Stunden pro Woche</td>
                    <td className="py-2 px-3">Minimiert, mehr Zeit für Beratung</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-semibold">Lead-Verluste</td>
                    <td className="py-2 px-3">Bis zu 15% verloren</td>
                    <td className="py-2 px-3">Nahezu null Verluste</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Persönlicher Stil</td>
                    <td className="py-2 px-3">Unregelmäßig, unpersönlich</td>
                    <td className="py-2 px-3">Individuell & authentisch</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Was spare ich wirklich? */}
        <section className="py-16 px-4 max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Was spare ich wirklich?
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-center gap-6 mb-6">
            <div className="flex flex-col w-full sm:w-1/2">
              <label htmlFor="inquiries" className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Anzahl eingehender Anfragen pro Monat
              </label>
              <select
                id="inquiries"
                value={inquiries}
                onChange={(e) => setInquiries(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
              >
                {[...Array(20)].map((_, i) => {
                  const val = 10 + i * 10;
                  return (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex flex-col w-full sm:w-1/2">
              <label htmlFor="hourlyRate" className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Durchschnittlicher Stundenlohn eines Mitarbeiters (€)
              </label>
              <select
                id="hourlyRate"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
              >
                {[...Array(8)].map((_, i) => {
                  const val = 15 + i * 5;
                  return (
                    <option key={val} value={val}>
                      {val}€
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          {/* Zusatznutzen Felder */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-center gap-6 mb-6">
            <div className="flex flex-col w-full sm:w-1/2">
              <label htmlFor="abschlussrate" className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Durchschnittliche Abschlussrate (%)
              </label>
              <input
                id="abschlussrate"
                type="number"
                inputMode="decimal"
                placeholder="z.B. 20"
                min="0"
                max="100"
                value={abschlussrate}
                onChange={(e) => setAbschlussrate(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2">
              <label htmlFor="wertProAbschluss" className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Ø Wert pro erfolgreichem Abschluss (€)
              </label>
              <input
                id="wertProAbschluss"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="z.B. 1500"
                value={wertProAbschluss}
                onChange={(e) => setWertProAbschluss(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
              />
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 mb-4">
            (Optional, aber sehr realistisch: Mit Advaic gewinnen Sie durch schnellere & persönliche Antworten ca. 15% mehr qualifizierte Leads aus Ihren bestehenden Anfragen.)
          </div>
          <div className="text-center">
            <button
              onClick={calculateSavings}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl shadow transition"
            >
              Berechnen
            </button>
          </div>
          {savings !== null && leadsRecovered !== null && (
            <div className="mt-8 text-center text-gray-800 dark:text-gray-200 space-y-2">
              <p className="text-xl font-semibold">
                Geschätzte Einsparung: <span className="text-purple-700">{savings.toFixed(2)} €</span>
              </p>
              <p className="text-lg">
                Geschätzte Rückgewinnung verlorener Leads: <span className="text-purple-700">{leadsRecovered}</span>
              </p>
              {abschlussrate.trim() !== "" &&
                wertProAbschluss.trim() !== "" &&
                !isNaN(Number(abschlussrate)) &&
                !isNaN(Number(wertProAbschluss)) && zusatzgewinn !== null && (
                  <div className="mt-6 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-xl p-5 max-w-xl mx-auto">
                    <div className="font-semibold text-purple-800 dark:text-purple-200 text-lg mb-1">
                      Geschätzter Zusatzgewinn durch mehr Abschlüsse:
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-200 mb-1">
                      €{zusatzgewinn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      (Basierend auf +15% mehr qualifizierten Leads, Ihrer Abschlussrate und dem Ø Wert pro Abschluss)
                    </div>
                  </div>
                )}
            </div>
          )}
        </section>

        {/* Hinweis */}
        <section className="mt-16 text-center text-sm text-gray-500 px-4 max-w-xl mx-auto">
          <p>
            Sichere dir den Preis von 249€/Monat dauerhaft – für alle, die vor dem{" "}
            <strong>1. Oktober</strong> starten. Danach wird Advaic teurer. Es
            lohnt sich schnell zu sein.
          </p>
        </section>

        {/* Neuer visueller Einstieg */}
        <section className="mt-32 max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">So funktioniert der Einstieg</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-purple-700 text-5xl mb-4">1</div>
              <h3 className="font-bold text-xl mb-2">Registrieren</h3>
              <p className="text-gray-600">Einfach E-Mail eingeben und starten. Keine Kreditkarte nötig.</p>
            </div>
            <div>
              <div className="text-purple-700 text-5xl mb-4">2</div>
              <h3 className="font-bold text-xl mb-2">Assistent einrichten</h3>
              <p className="text-gray-600">Kurzes Onboarding, Ton & Stil anpassen, Vorschau testen.</p>
            </div>
            <div>
              <div className="text-purple-700 text-5xl mb-4">3</div>
              <h3 className="font-bold text-xl mb-2">Leads empfangen</h3>
              <p className="text-gray-600">Ab jetzt beantwortet Advaic deine Anfragen automatisch – ganz in deinem Stil.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky CTA Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-600 text-white py-4 px-6 flex flex-col md:flex-row items-center justify-between shadow-lg z-50">
          <p className="text-lg font-semibold mb-2 md:mb-0">
            Starte jetzt kostenlos und verliere nie wieder einen Lead.
          </p>
          <Link
            href="/start"
            className="bg-white text-purple-700 font-bold py-2 px-4 rounded-xl hover:bg-gray-100 transition"
          >
            14 Tage kostenlos testen
          </Link>
        </div>
      )}
    </>
  );
}
