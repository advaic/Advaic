"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/marketing/Container";
import LoopVideo from "./LoopVideo";
import PremiumVideoFrame from "./PremiumVideoFrame";

type StepId = "inbox" | "rules" | "checks" | "log";

type StepConfig = {
  id: StepId;
  title: string;
  text: string;
  bullet: string;
  webm: string;
  mp4: string;
  poster: string;
};

const steps: StepConfig[] = [
  {
    id: "inbox",
    title: "Schritt 1: Eingang",
    text: "Eine E-Mail kommt rein. Advaic prüft, ob es nach einer echten Interessenten-Anfrage aussieht.",
    bullet: "Newsletter und Systemmails werden automatisch erkannt und ignoriert.",
    webm: "/loops/tour-inbox.webm",
    mp4: "/loops/tour-inbox.mp4",
    poster: "/loops/tour-inbox.jpg",
  },
  {
    id: "rules",
    title: "Schritt 2: Entscheidung",
    text: "Advaic ordnet die E-Mail einer Kategorie zu: Auto senden, Zur Freigabe oder Ignorieren.",
    bullet: "Im Zweifel wird nicht automatisch gesendet, zum Beispiel bei unklarem Empfänger.",
    webm: "/loops/tour-rules.webm",
    mp4: "/loops/tour-rules.mp4",
    poster: "/loops/tour-rules.jpg",
  },
  {
    id: "checks",
    title: "Schritt 3: Qualitätskontrollen",
    text: "Bevor etwas rausgeht, laufen automatische Prüfungen auf Relevanz, Vollständigkeit, Ton und Risiko.",
    bullet: "Wenn etwas fehlt oder unklar ist, geht es zur Freigabe.",
    webm: "/loops/tour-checks.webm",
    mp4: "/loops/tour-checks.mp4",
    poster: "/loops/tour-checks.jpg",
  },
  {
    id: "log",
    title: "Schritt 4: Versand & Verlauf",
    text: "Die Antwort wird über Ihr Postfach gesendet. Sie sehen jederzeit: Eingang → Entscheidung → Versand — mit Status und Zeitstempel.",
    bullet: "So bleibt alles nachvollziehbar, auch wenn Autopilot aktiv ist.",
    webm: "/loops/tour-log.webm",
    mp4: "/loops/tour-log.mp4",
    poster: "/loops/tour-log.jpg",
  },
];

export default function StickyTour() {
  const [activeStep, setActiveStep] = useState<StepId>("inbox");
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSteps = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const nextStep = visibleSteps[0]?.target.getAttribute("data-step") as StepId | null;
        if (nextStep) {
          setActiveStep(nextStep);
        }
      },
      {
        threshold: 0.6,
      }
    );

    stepRefs.current.forEach((step) => {
      if (step) {
        observer.observe(step);
      }
    });

    return () => observer.disconnect();
  }, []);

  const activeLabel = useMemo(
    () => steps.find((step) => step.id === activeStep)?.title ?? "Schritt 1: Eingang",
    [activeStep]
  );

  return (
    <section id="ablauf" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">So läuft eine Anfrage in der Praxis ab</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Hier sehen Sie Schritt für Schritt, was passiert — und warum das sicher ist.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 lg:col-span-6">
            <div className="space-y-6">
              {steps.map((step, index) => {
                const isActive = step.id === activeStep;

                return (
                  <article
                    key={step.id}
                    ref={(element) => {
                      stepRefs.current[index] = element;
                    }}
                    data-step={step.id}
                    className={`rounded-[var(--radius)] bg-white p-6 ring-1 shadow-[var(--shadow-sm)] transition md:p-7 ${
                      isActive
                        ? "ring-[var(--gold)] shadow-[var(--shadow-md)]"
                        : "ring-[var(--border)] hover:-translate-y-[2px] hover:ring-[rgba(11,15,23,.16)] hover:shadow-[var(--shadow-md)]"
                    }`}
                  >
                    <h3 className="h3">{step.title}</h3>
                    <p className="body mt-3 max-w-[64ch] text-[var(--muted)]">{step.text}</p>
                    <p className="mt-3 flex items-start gap-2 text-sm text-[var(--muted)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                      <span>{step.bullet}</span>
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="lg:sticky lg:top-[108px]">
              <PremiumVideoFrame label={activeLabel} caption="Aktive Prozessansicht">
                <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-[var(--surface-2)]">
                  {steps.map((step) => {
                    const isActive = step.id === activeStep;

                    return (
                      <LoopVideo
                        key={step.id}
                        webm={step.webm}
                        mp4={step.mp4}
                        poster={step.poster}
                        ariaLabel={`Video-Loop: ${step.title}`}
                        isActive={isActive}
                        className={`absolute inset-0 h-full w-full bg-[var(--surface-2)] object-contain transition-opacity duration-500 ${
                          isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
                        }`}
                        placeholderLabel={step.title}
                      />
                    );
                  })}
                </div>
              </PremiumVideoFrame>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
