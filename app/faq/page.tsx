"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import FAQAccordion from "@/components/FAQAccordion";

const faqItems = [
  {
    question: "Für wen ist Advaic gedacht?",
    answer: "Advaic ist perfekt für Einzelmakler oder kleinere Agenturen, die zu viele Nachrichten bekommen und keine Leads mehr verlieren wollen.",
  },
  {
    question: "Warum gibt es nur einen Plan?",
    answer: "Unser Produkt ist in einem Punkt klar: Es soll dir Zeit sparen und Leads sichern. Deshalb bieten wir eine Lösung, die alles abdeckt – ohne Feature-Grenzen.",
  },
  {
    question: "Wie läuft das Onboarding ab?",
    answer: "Nach der Anmeldung wirst du Schritt für Schritt durch die Einrichtung geführt. Unser System lernt deinen Stil, integriert sich in deine Inbox und antwortet sofort auf neue Nachrichten.",
  },
  {
    question: "Kann ich den Assistenten testen?",
    answer: "Ja, du kannst Advaic 14 Tage lang kostenlos testen – komplett unverbindlich und ohne automatische Verlängerung.",
  },
  {
    question: "Wie funktioniert die Integration in mein bestehendes System?",
    answer: "Advaic integriert sich direkt in deine E-Mail-Inbox (z. B. Gmail oder Outlook) über eine sichere Schnittstelle. Alle eingehenden Nachrichten werden analysiert, beantwortet und samt Kontext im Dashboard angezeigt – ohne dass du deine gewohnte Arbeitsweise ändern musst."
  },
  {
    question: "Können meine Antworten individuell angepasst werden?",
    answer: "Ja, absolut. Du kannst deinen persönlichen Stil definieren, Antwortvorlagen erstellen und sogar Regeln festlegen, wann Advaic wie antworten soll. Das System passt sich an dich an – nicht umgekehrt.",
  },
  {
    question: "Was passiert mit Nachrichten, bei denen Advaic unsicher ist?",
    answer: "In solchen Fällen wird die Nachricht automatisch markiert und dir zur Freigabe vorgelegt. Du behältst also jederzeit die Kontrolle, insbesondere bei wichtigen oder sensiblen Anfragen.",
  },
  {
    question: "Ist Advaic DSGVO-konform?",
    answer: "Ja. Advaic ist vollständig DSGVO-konform. Alle Daten werden sicher gespeichert, verarbeitet und können bei Bedarf exportiert werden. Du kannst jederzeit nachvollziehen, welche Daten verarbeitet wurden und warum.",
  },
  {
    question: "Wie schnell antwortet der Assistent?",
    answer: "In der Regel antwortet Advaic innerhalb von Sekunden auf neue Anfragen. Die Geschwindigkeit hängt nur von der Plattformintegration ab – nicht von dir oder deinem Team.",
  },
  {
    question: "Was kostet Advaic nach der Testphase?",
    answer: "Nach der kostenlosen Testphase kostet Advaic regulär 299 €/Monat (aktuell noch 5 Plätze zum Einführungspreis verfügbar). Es gibt keine versteckten Kosten – alle Funktionen sind inklusive.",
  },
  {
    question: "Kann ich das System gemeinsam mit meinem Team nutzen?",
    answer: "Ja. Auch wenn Advaic besonders für Einzelmakler optimiert ist, lässt sich das System problemlos in kleinen Teams nutzen. Künftig werden erweiterte Funktionen für Teams ergänzt.",
  },
  {
    question: "Kann ich Nachrichten auch nachträglich bearbeiten oder löschen?",
    answer: "Ja. Du kannst alle Antworten von Advaic einsehen, manuell ändern, verwerfen oder komplett löschen. Du hast jederzeit volle Kontrolle über die Kommunikation mit deinen Interessenten.",
  },
  {
    question: "Wie funktioniert die Qualitätsprüfung der Antworten?",
    answer: "Jede Antwort wird von einem internen KI-Modul automatisch bewertet. Falls eine Antwort nicht klar oder hilfreich genug ist, wird sie überarbeitet oder an dich zur Freigabe weitergeleitet.",
  },
  {
    question: "Was passiert, wenn ein Interessent später nochmal antwortet?",
    answer: "Das System erkennt automatisch, wenn ein bestehender Interessent erneut schreibt, greift den bisherigen Gesprächsverlauf auf und führt die Unterhaltung intelligent fort – wie ein echter Mitarbeiter.",
  }
];

export default function FAQPage() {
  const [query, setQuery] = useState("");

  // quick filters: keywords to set on click
  const quickFilters: { label: string; value: string }[] = [
    { label: "Onboarding", value: "Onboarding" },
    { label: "Integration", value: "Integration" },
    { label: "Preise", value: "Testphase" },
    { label: "Datenschutz", value: "DSGVO" },
  ];

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqItems;
    return faqItems.filter((it) => {
      return (
        it.question.toLowerCase().includes(q) ||
        it.answer.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="bg-gradient-to-b from-teal-50 via-purple-50 to-white pb-32 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8 pt-32">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">Häufige Fragen zu Advaic</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Hier findest du Antworten auf die meistgestellten Fragen zu Advaic. Nutze die Suche oder die Schnellfilter, um schneller zu finden, was du brauchst.
          </p>
        </div>

        {/* Quick search + filters */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label htmlFor="faq-search" className="sr-only">Suche</label>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Frage eingeben (z. B. 'Onboarding', 'Preise', 'Integration')"
              className="flex-1 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={() => setQuery("")}
              className="ml-auto sm:ml-0 bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-lg"
            >
              Löschen
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickFilters.map((f) => (
              <button
                key={f.label}
                onClick={() => setQuery(f.value)}
                className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto text-sm text-gray-500 self-center">Ergebnisse: <strong className="text-gray-900">{filteredItems.length}</strong></div>
          </div>
        </div>

        {/* Accordion */}
        <div className="mb-12">
          <FAQAccordion items={filteredItems} />
        </div>

        {/* Du hast noch Fragen? CTA */}
        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">Du hast noch Fragen?</h3>
          <p className="text-gray-600 mb-6">Wenn etwas unklar ist oder du ein individuelles Angebot möchtest, melde dich gern bei uns. Wir helfen dir persönlich weiter.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/kontakt" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow">Kontakt aufnehmen</Link>
            <Link href="/preise" className="inline-block bg-white border border-gray-200 text-gray-800 py-3 px-6 rounded-lg">Zu den Preisen</Link>
          </div>
        </div>

      </div>
    </div>
  );
}