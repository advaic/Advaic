"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Container from "./Container";
import LoopVideo from "./produkt/LoopVideo";

type LoopId = "inbox" | "rules" | "checks" | "approve";

type TourStep = {
  id: LoopId;
  title: string;
  body: string;
  bullets: string[];
  webm: string;
  mp4: string;
};

const steps: TourStep[] = [
  {
    id: "inbox",
    title: "Neue E-Mail kommt rein",
    body:
      "Advaic prüft, ob eine Nachricht eine echte Interessenten-Anfrage oder eine Nicht-Anfrage ist.",
    bullets: [
      "Absender- und Inhaltssignal werden analysiert",
      "Newsletter und Systemmails werden früh gefiltert",
    ],
    webm: "/loops/inbox.webm",
    mp4: "/loops/inbox.mp4",
  },
  {
    id: "rules",
    title: "Auto, Freigabe oder Ignorieren",
    body:
      "Die Anfrage wird anhand klarer Regeln in den passenden Pfad eingeordnet.",
    bullets: [
      "Klare Standardfälle können automatisch laufen",
      "Unklare oder heikle Fälle gehen zur Freigabe",
    ],
    webm: "/loops/rules.webm",
    mp4: "/loops/rules.mp4",
  },
  {
    id: "checks",
    title: "Qualitätschecks laufen",
    body:
      "Vor dem Versand validiert Advaic Relevanz, Vollständigkeit, Risiko und Stil.",
    bullets: [
      "Ton und Lesbarkeit werden gegen Ihre Vorgaben geprüft",
      "Bei Unsicherheit wird nicht automatisch gesendet",
    ],
    webm: "/loops/checks.webm",
    mp4: "/loops/checks.mp4",
  },
  {
    id: "approve",
    title: "Zur Freigabe und manuelles Senden",
    body:
      "Sie entscheiden bei Ausnahmefällen mit einem Klick und behalten jederzeit die finale Kontrolle.",
    bullets: [
      "Freigabeansicht mit Status und Verlauf",
      "Versand erfolgt weiterhin über Ihr eigenes Postfach",
    ],
    webm: "/loops/approve.webm",
    mp4: "/loops/approve.mp4",
  },
];

export default function StickyTour() {
  const [activeLoop, setActiveLoop] = useState<LoopId>("inbox");
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;

        const nextId = visible[0].target.getAttribute("data-loop") as LoopId | null;
        if (nextId) setActiveLoop(nextId);
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.65],
      }
    );

    stepRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const activeStep = useMemo(
    () => steps.find((step) => step.id === activeLoop) ?? steps[0],
    [activeLoop]
  );

  return (
    <section id="tour" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="mb-10 max-w-2xl">
          <h2 className="h2">Volle Transparenz im laufenden Entscheidungsfluss</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Beim Scrollen sehen Sie, wie Advaic Schritt für Schritt von Eingang
            bis Freigabe oder Versand entscheidet.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="space-y-8">
              {steps.map((step, index) => {
                const active = step.id === activeLoop;
                return (
                  <div
                    key={step.id}
                    ref={(node) => {
                      stepRefs.current[index] = node;
                    }}
                    data-loop={step.id}
                    className={`card-base p-6 transition-all duration-200 ${
                      active ? "border-[var(--gold)] shadow-[var(--shadow-md)]" : ""
                    }`}
                  >
                    <p className="label">Schritt {index + 1}</p>
                    <h3 className="h3 mt-2">{step.title}</h3>
                    <p className="helper mt-3">{step.body}</p>
                    <ul className="mt-4 space-y-2">
                      {step.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-[110px]">
              <div className="card-base overflow-hidden p-3">
                <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
                  <span className="ml-2 text-xs text-[var(--muted)]">{activeStep.title}</span>
                </div>

                <div className="mt-3 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
                  <LoopVideo
                    key={activeStep.id}
                    webm={activeStep.webm}
                    mp4={activeStep.mp4}
                    className="aspect-video w-full object-cover"
                    ariaLabel={`Produktloop: ${activeStep.title}`}
                    placeholderLabel={activeStep.title}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
