"use client";

import Image from "next/image";
import LeadTestForm from "@/components/LeadTestForm";
import FAQAccordion from "@/components/FAQAccordion";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const steps = [
  {
    title: "1. Anfrage kommt rein",
    description:
      "Egal ob per Mail, Kontaktformular oder WhatsApp – Advaic erkennt automatisch, ob es sich um einen ernsthaften Lead handelt.",
  },
  {
    title: "2. Sofortige Antwort",
    description:
      "Innerhalb weniger Sekunden wird in deinem Stil geantwortet – inklusive Rückfragen, Links und Emojis, wenn du möchtest.",
  },
  {
    title: "3. Persönliche Übergabe",
    description:
      "Wenn nötig wird der Lead an dich übergeben – mit einer Zusammenfassung, Handlungsempfehlung und Einschätzung zur Dringlichkeit.",
  },
  {
    title: "4. Follow-up bei Funkstille",
    description:
      "Hat der Lead nicht geantwortet, erinnert Advaic automatisch nach – freundlich, aber bestimmt. Damit niemand verloren geht.",
  },
];

const stepVariants = {
  visibleRight: { opacity: 1, x: 0, zIndex: 10, scale: 1, transition: { duration: 0.6 } },
  hiddenRight: { opacity: 0, x: 100, zIndex: 0, scale: 0.95, transition: { duration: 0.6 } },
  visibleLeft: { opacity: 1, x: 0, zIndex: 10, scale: 1, transition: { duration: 0.6 } },
  hiddenLeft: { opacity: 0, x: -100, zIndex: 0, scale: 0.95, transition: { duration: 0.6 } },
};

function Step({
  step,
  index,
}: {
  step: { title: string; description: string };
  index: number;
}) {
  const side = index % 2 === 0 ? "right" : "left";
  const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.75 });

  return (
    <div className="relative flex justify-center min-h-[300px] mb-24">
      <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#E5C97B] -translate-x-1/2"></div>
      {side === "left" ? (
        <motion.div
          ref={ref}
          variants={stepVariants}
          initial="hiddenLeft"
          animate={inView ? "visibleLeft" : "hiddenLeft"}
          exit="hiddenLeft"
          className="absolute left-0 bg-white rounded-3xl p-5 shadow-xl max-w-md w-full border-l-4 border-[#E5C97B]"
          style={{ willChange: "transform, opacity, z-index" }}
        >
          <h3 className="text-lg md:text-xl font-semibold text-[#1a1a1a] mb-1">
            {step.title}
          </h3>
          <p className="text-sm md:text-base text-[#4d4d4d]">
            {step.description}
          </p>
        </motion.div>
      ) : (
        <motion.div
          ref={ref}
          variants={stepVariants}
          initial="hiddenRight"
          animate={inView ? "visibleRight" : "hiddenRight"}
          exit="hiddenRight"
          className="absolute right-0 bg-white rounded-3xl p-5 shadow-xl max-w-md w-full border-l-4 border-[#E5C97B]"
          style={{ willChange: "transform, opacity, z-index" }}
        >
          <h3 className="text-lg md:text-xl font-semibold text-[#1a1a1a] mb-1">
            {step.title}
          </h3>
          <p className="text-sm md:text-base text-[#4d4d4d]">
            {step.description}
          </p>
        </motion.div>
      )}
      <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-white border-2 border-gray-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
    </div>
  );
}

export default function ProduktPage() {
  return (
    <main className="min-h-screen bg-[#f9f9f9] text-[#1a1a1a]">
      {/* Hero */}
      <section className="text-center px-4 pt-20">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-[#1a1a1a]">
          Alles, was <span className="underline decoration-[#E5C97B] decoration-4 underline-offset-8">Advaic</span> kann – auf einen Blick.
        </h1>
        <p className="mt-6 text-lg text-[#4d4d4d] max-w-2xl mx-auto">
          Dein persönlicher KI-Assistent, der auf deine Leads antwortet,
          zusammenfasst, priorisiert und sogar nachfasst. Du behältst die
          Kontrolle.
        </p>
      </section>

      {/* Argumente */}
      <section className="mt-24 px-4 max-w-4xl mx-auto grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Antwortet in deinem Stil",
            desc: "Advaic klingt wie du – freundlich, professionell und persönlich.",
          },
          {
            title: "Vollständig anpassbar",
            desc: "Ton, Templates und Eskalationsregeln – du entscheidest, wie Advaic reagiert.",
          },
          {
            title: "100% DSGVO-konform",
            desc: "Gehostet in Europa. Keine Speicherung sensibler Daten.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" }}
            className="bg-white rounded-3xl p-5 shadow transition border-l-4 border-[#E5C97B] cursor-pointer"
          >
            <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2">
              {item.title}
            </h3>
            <p className="text-[#4d4d4d] text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Scroll-Step-Flow */}
      <section className="mt-32 px-4 max-w-md mx-auto">
        <h2 className="text-4xl font-bold text-center text-[#1a1a1a] mb-16">
          So läuft es ab – <span className="text-[#E5C97B] underline decoration-[#E5C97B] decoration-4 underline-offset-4">Schritt für Schritt</span>
        </h2>
        <div className="relative">
          {steps.map((step, i) => (
            <Step key={i} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* Bild + USP */}
      <section className="mt-32 px-4 max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center border-t-4 border-[#E5C97B] pt-16">
        <Image
          src="/dashboard-preview.png"
          alt="Dashboard Vorschau"
          width={700}
          height={500}
          className="rounded-xl border shadow-lg border-[#E5C97B]"
        />
        <div>
          <h2 className="text-4xl font-bold mb-4 text-[#1a1a1a]">
            Warum <span className="text-[#E5C97B] underline decoration-[#E5C97B] decoration-4 underline-offset-4">Advaic</span> anders ist
          </h2>
          <p className="text-[#4d4d4d] text-base">
            Die meisten Tools klingen generisch. Advaic schreibt, wie du denkst.
            Jede Antwort wird auf deinen Stil, dein Portfolio und deine Regeln
            abgestimmt.
            <br className="hidden md:block" />
            Und das Beste: Alles kommt direkt aus deinem Postfach.
          </p>
        </div>
      </section>

      {/* Zahlen */}
      <section className="mt-32 px-4 max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
        {[
          { value: "24/7", label: "Antwortzeit" },
          { value: "+35%", label: "Mehr qualifizierte Leads" },
          { value: "99,8%", label: "Zufriedenheit der Agenten" },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" }}
            className="bg-white rounded-3xl p-5 shadow border-l-4 border-[#E5C97B] transition cursor-pointer"
          >
            <div className="text-4xl font-extrabold text-[#1a1a1a] mb-2">
              {item.value}
            </div>
            <div className="text-sm text-[#4d4d4d]">{item.label}</div>
          </motion.div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mt-32 px-4 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-[#1a1a1a] mb-12">
          <span className="text-[#E5C97B] underline decoration-[#E5C97B] decoration-4 underline-offset-4">FAQ</span>
        </h2>
        <div className="space-y-4">
          <FAQAccordion
            items={[
              {
                question: "Kann ich den Stil der Antworten selbst bestimmen?",
                answer:
                  "Ja! Du kannst sowohl Templates hinterlegen als auch den generellen Ton (Du/Sie, Emojis, etc.) anpassen.",
              },
              {
                question:
                  "Wie stellt ihr sicher, dass die Antworten wirklich natürlich und professionell wirken?",
                answer:
                  "Advaic wird individuell für dich trainiert. Und jede Nachricht wird vor dem Senden automatisch geprüft.",
              },
              {
                question:
                  "Was passiert, wenn die Anfrage unklar oder ungewöhnlich ist?",
                answer:
                  "Dann eskaliert Advaic an dich – inklusive Zusammenfassung und Vorschlag für die Antwort.",
              },
            ]}
          />
        </div>
      </section>

      {/* Kontaktformular */}
      <section className="mt-32 px-4 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-[#1a1a1a] mb-8">
          <span className="underline decoration-[#E5C97B] decoration-4 underline-offset-4">Noch Fragen?</span>
        </h2>
        <LeadTestForm />
      </section>
    </main>
  );
}
