 "use client";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeadTestForm from "@/components/LeadTestForm";
import FAQAccordion from "@/components/FAQAccordion";
import ChatWidget from "@/components/ChatWidget";

export default function HomePage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);

  const primaryButtonClass =
    "bg-[#121212] text-white px-8 py-4 rounded-full hover:bg-[#E5C97B] hover:text-black transition font-semibold shadow-md";

  const tabs = [
    {
      title: "Advaic antwortet wie ein echter Mitarbeiter",
      subtitle:
        "Sofort, professionell, und immer im richtigen Ton – als hätte der Makler selbst geantwortet.",
      text: `Advaic spricht mit Ihrer Stimme – dank Ihrer persönlichen Textbibliothek
klingt jede Antwort natürlich und authentisch. Anliegen werden
automatisch erkannt und blitzschnell beantwortet – auch nach Feierabend.
Und wenn eine Nachricht zu spezifisch oder sensibel ist, wird sie
zuverlässig an Sie weitergeleitet.`,
      cta: "Mehr über das System erfahren",
      image: "/images/tab-antworten.jpg",
    },
    {
      title: "Volle Kontrolle. Jederzeit.",
      subtitle: "Sie behalten den Überblick – nicht der Algorithmus.",
      text: `Advaic antwortet in Ihrem Stil – aber nur nach Ihren Regeln. Sie
entscheiden, welche Antworten automatisiert rausgehen und welche
geprüft werden sollen. Alle Konversationen sind für Sie live einsehbar und
anpassbar. Bei Unsicherheit leitet Advaic die Nachricht sofort an Sie
weiter – mit klarer Kennzeichnung und Vorschlag zur nächsten Aktion.`,
      cta: "Wie Sie die Kontrolle behalten",
      image: "/images/tab-kontrolle.jpg",
    },
    {
      title: "Maximale Sicherheit – für Sie und Ihre Kund:innen",
      subtitle:
        "Ihre Kommunikation und Daten werden nach höchsten Standards geschützt.",
      text: `Advaic setzt auf modernste Sicherheitsprotokolle – inklusive End-to-End-
Verschlüsselung, geschützter Serverstandorte in der EU und robuster
Zugangskontrollen. Ihre sensiblen Daten bleiben dort, wo sie hingehören:
bei Ihnen.`,
      cta: "So schützt Advaic Ihre Daten",
      image: "/images/tab-sicherheit.jpg",
    },
    {
      title: "Perfekte Nachrichten. Immer.",
      subtitle:
        "Jede Antwort wird doppelt geprüft – automatisch und von Ihnen kontrollierbar.",
      text: `Bevor eine Nachricht an den Kunden geht, bewertet unsere KI automatisch
ihre Qualität – basierend auf Klarheit, Ton und Relevanz. Ist die Antwort
gut, wird sie direkt gesendet. Falls nicht, wird sie automatisch
umformuliert und erneut geprüft. Nur wenn sie auch danach nicht den
Standard erfüllt, wird die Konversation an Sie weitergeleitet. So bleibt jede
Antwort professionell, zuverlässig und in Ihrer Tonalität – ganz ohne
Mehraufwand.`,
      cta: "Wie die Qualitätsprüfung funktioniert",
      image: "/images/tab-qualitaet.jpg",
    },
    {
      title: "Nie wieder Kunden verlieren.",
      subtitle:
        "Automatisierte Nachfassnachrichten – persönlich und pünktlich.",
      text: `Advaic merkt sich jeden Kontakt und fragt nach, wenn keine Antwort
kommt – mit personalisierten Follow-ups, die wirken wie von Hand
geschrieben. Ihre Interessenten bleiben warm, ohne dass Sie ständig
nachfassen müssen. So geht Kundenpflege heute.`,
      cta: "Wie Follow-ups automatisch funktionieren",
      image: "/images/tab-followup.jpg",
    },
    {
      title: "100 % DSGVO-Konformität",
      subtitle:
        "Advaic erfüllt alle Anforderungen der Datenschutz-Grundverordnung – automatisch.",
      text: `Unsere Systeme sind so gebaut, dass alle Datenverarbeitungen
vollständig DSGVO-konform ablaufen – inklusive Löschpflichten,
Datenportabilität und Einwilligungsverwaltung. Sie behalten jederzeit die
Kontrolle über gespeicherte Informationen und können sicher
kommunizieren – ohne rechtliche Risiken.`,
      cta: "Mehr über DSGVO Konformität erfahren",
      image: "/images/tab-dsgvo.jpg",
    },
  ];

  const tabRoutes = [
    "/produkt/antworten",
    "/produkt/kontrolle",
    "/produkt/sicherheit",
    "/produkt/qualitaetspruefung",
    "/produkt/follow-ups",
    "/produkt/dsgvo",
  ];

  const handleTabCta = () => {
    const href = tabRoutes[activeTab] || "/produkt";
    router.push(href);
  };

  useEffect(() => {
    if (user) {
      router.push("/app");
    }
  }, [user, router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
  };

  return (
    <main className="bg-[#f9f9f9] text-[#1a1a1a]">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 bg-[#f9f9f9]">
        <div className="max-w-6xl mx-auto w-full flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 max-w-4xl leading-tight text-[#1a1a1a]">
            Antworten Sie Interessenten in Sekunden.
          </h1>
          <p className="text-lg md:text-xl text-[#4d4d4d] max-w-2xl mb-8">
            Advaic schreibt automatisch, persönlich und fehlerfrei – genau in Ihrem Stil.
            DSGVO-konform, zuverlässig und 24/7.
          </p>
          <button
            onClick={handleLogin}
            className={primaryButtonClass}
          >
            Kostenlos testen
          </button>
          <p className="mt-4 text-sm text-[#b3b3b3]">
            2 Wochen gratis. Keine Kreditkarte erforderlich.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-6 items-center justify-center text-sm text-[#4d4d4d]">
            <div className="flex items-center gap-2">
              <span className="text-[#E5C97B]">✓</span>
              <span>Antwortet direkt aus Ihrem Postfach</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E5C97B]">✓</span>
              <span>DSGVO-konform (EU-Hosting)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E5C97B]">✓</span>
              <span>Jederzeit kündbar</span>
            </div>
          </div>
          {/* 🔹 LeadTestForm direkt in der Hero Section */}
          <div className="mt-12 w-full max-w-2xl">
            <LeadTestForm />
          </div>
        </div>
      </section>

      {/* Product demo */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#1a1a1a]">
              Sehen Sie Advaic in 60 Sekunden.
            </h2>
            <p className="text-lg text-[#4d4d4d] mb-6 max-w-xl">
              So läuft eine Anfrage rein – und Advaic antwortet sofort, sauber und in Ihrem Stil.
              Sie behalten jederzeit die Kontrolle.
            </p>
            <button
              onClick={handleLogin}
              className={primaryButtonClass}
            >
              Kostenlos testen
            </button>
            <p className="mt-4 text-sm text-[#b3b3b3]">
              Ohne Setup-Stress. In unter 2 Minuten verbunden.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E5C97B] shadow-2xl bg-white p-3">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
              {/* Replace the src with your real demo video file or embed */}
              <video
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
                src="/videos/advaic-demo.mp4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-[#f9f9f9] py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-[#1a1a1a]">Warum Advaic?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white text-left">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">⏳ Verlorene Zeit</h3>
            <p className="text-[#4d4d4d]">
              Stundenlang Nachrichten beantworten? Das geht besser – und
              schneller.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white text-left">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              📉 Verschenkte Anfragen
            </h3>
            <p className="text-[#4d4d4d]">
              Interessenten springen ab, weil sie zu spät eine Antwort erhalten? Nicht
              mit uns.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white text-left">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              😩 Stress & Überforderung
            </h3>
            <p className="text-[#4d4d4d]">
              Volles Postfach, keine Zeit – Advaic verschafft Ihnen wieder
              Kontrolle.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#f9f9f9] text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-[#1a1a1a]">
          So funktioniert Advaic
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">1. Verbinden</h3>
            <p className="text-[#4d4d4d]">
              Verbinden Sie Ihr Postfach mit Advaic in unter 2 Minuten.
              DSGVO-konform & sicher.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              2. Antworten automatisieren
            </h3>
            <p className="text-[#4d4d4d]">
              Advaic analysiert jede Anfrage und antwortet in Ihrem Stil –
              automatisch und sofort.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              3. Kontrolle behalten
            </h3>
            <p className="text-[#4d4d4d]">
              Sie sehen alle Nachrichten, geben Antworten frei oder passen sie
              an – volle Kontrolle.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Tabs */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between overflow-x-auto border-b border-[#E5C97B] text-center text-sm sm:text-base font-semibold text-[#4d4d4d] mb-10">
            {[
              "Antworten",
              "Kontrolle",
              "Sicherheit",
              "Qualitätsprüfung",
              "Follow-ups",
              "DSGVO",
            ].map((tab, idx) => (
              <button
                key={tab}
                className={`px-4 py-3 whitespace-nowrap transition-all duration-300 border-b-4 ${
                  activeTab === idx
                    ? "border-[#E5C97B] text-[#1a1a1a] bg-[#f9f9f9] rounded-t-xl"
                    : "border-transparent hover:text-[#1a1a1a]"
                }`}
                onClick={() => setActiveTab(idx)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="transition-all duration-300 bg-[#f9f9f9] rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-extrabold mb-2 text-[#1a1a1a]">
                {tabs[activeTab].title}
              </h3>
              <h4 className="text-lg font-semibold text-[#4d4d4d] mb-4">
                {tabs[activeTab].subtitle}
              </h4>
              <p className="text-[#4d4d4d] mb-6 whitespace-pre-line">
                {tabs[activeTab].text}
              </p>
              <button
                onClick={handleTabCta}
                className="bg-[#121212] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#E5C97B] hover:text-black transition shadow-md"
              >
                {tabs[activeTab].cta}
              </button>
            </div>
            <div className="md:w-1/2">
              <img
                src={tabs[activeTab].image}
                alt={tabs[activeTab].title}
                className="rounded-3xl w-full object-cover shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f9f9f9] py-20 px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 text-[#1a1a1a]">
          Was Advaic für Sie übernimmt
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              🎯 Antworten in Ihrem Stil
            </h3>
            <p className="text-[#4d4d4d]">
              Individuell, natürlich, professionell – als käme jede Antwort von
              Ihnen.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              📨 E-Mail direkt aus Ihrem Postfach
            </h3>
            <p className="text-[#4d4d4d]">
              Keine externen Plattformen – Antworten kommen direkt von Ihrer
              Adresse.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              🧠 Interessenten-Zusammenfassungen
            </h3>
            <p className="text-[#4d4d4d]">
              Verstehen Sie auf einen Blick, worum es geht – mit klaren
              Handlungsempfehlungen.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              🔥 Priorisierung nach Dringlichkeit
            </h3>
            <p className="text-[#4d4d4d]">
              Advaic erkennt automatisch: Welcher Interessent ist heiß? Wo lohnt sich
              Follow-up?
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
              🔁 Automatische Follow-ups
            </h3>
            <p className="text-[#4d4d4d]">
              Keine Antwort vom Interessenten? Advaic meldet sich nach –
              freundlich & gezielt.
            </p>
          </div>
          <div className="p-6 rounded-3xl border border-[#E5C97B] shadow-lg bg-white">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">🔒 DSGVO-Konformität</h3>
            <p className="text-[#4d4d4d]">
              Sicherheit made in Germany – Advaic erfüllt alle gesetzlichen
              Vorgaben.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section (Redesigned) */}
      <section
        id="preise"
        className="py-24 px-6 bg-white text-center flex justify-center"
      >
        <div className="bg-white border border-[#E5C97B] rounded-2xl shadow-2xl max-w-xl w-full p-10 text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-[#1a1a1a]">
            Ihr persönlicher KI-Assistent für Anfragen
          </h2>
          <p className="text-center text-lg text-[#4d4d4d] mb-4">
            Alles, was Sie brauchen – in einem Plan.
          </p>

          <div className="text-center mb-8">
            <span className="text-5xl font-extrabold text-[#1a1a1a]">249€</span>
            <span className="text-lg text-[#4d4d4d]"> / Monat</span>
            <p className="text-sm text-[#b3b3b3] mt-1">
              14 Tage kostenlos testen
            </p>
          </div>

          <ul className="space-y-4 text-[#1a1a1a] mb-10">
            <li className="flex items-start gap-3">
              <span className="text-[#E5C97B] mt-1">✓</span>
              Automatische Antworten in Ihrem Stil
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E5C97B] mt-1">✓</span>
              Interessenten-Zusammenfassungen & Empfehlungen
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E5C97B] mt-1">✓</span>
              Follow-Ups bei Inaktivität
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E5C97B] mt-1">✓</span>
              Volle DSGVO-Konformität & Datensicherheit
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E5C97B] mt-1">✓</span>
              Persönlicher Support vom Gründer
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E5C97B] mt-1">✓</span>
              Jederzeit kündbar
            </li>
          </ul>

          <div className="text-center">
            <button
              onClick={handleLogin}
              className={primaryButtonClass}
            >
              Kostenlos testen
            </button>
          </div>

          <p className="text-sm text-[#b3b3b3] text-center mt-4">
            Kein Risiko. Kein Haken. Einfach testen.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-[#1a1a1a]">
          Häufige Fragen
        </h2>
        <div className="max-w-4xl mx-auto">
          <FAQAccordion
            items={[
              {
                question: "Klingt das nicht zu „robotisch“?",
                answer:
                  "Nein. Advaic schreibt wie Sie – mit Persönlichkeit und Gefühl. Wir passen jeden Stil individuell an.",
              },
              {
                question: "Behalte ich die Kontrolle?",
                answer:
                  "Ja. Sie sehen alle Antworten und können entscheiden, ob sie freigegeben oder angepasst werden.",
              },
              {
                question: "Ist das sicher und DSGVO-konform?",
                answer:
                  "Absolut. Ihre Daten bleiben in Europa und Sie erhalten auf Wunsch eine vollständige Dokumentation.",
              },
            ]}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center bg-[#f9f9f9]">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-[#1a1a1a]">
          Keine Antwort mehr verpassen.
        </h2>
        <p className="text-lg text-[#4d4d4d] mb-8">
          Automatisieren Sie Ihre Kommunikation – persönlich, schnell, sicher.
        </p>
        <button
          onClick={handleLogin}
          className={primaryButtonClass}
        >
          Kostenlos testen
        </button>
      </section>

      {/* Footer */}
      <footer
        id="kontakt"
        className="bg-[#f9f9f9] py-6 text-center text-sm text-[#4d4d4d]"
      >
        © {new Date().getFullYear()} Advaic. Alle Rechte vorbehalten.
      </footer>
      <ChatWidget />
    </main>
  );
}
