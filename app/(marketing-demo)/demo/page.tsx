import Link from "next/link";
import Container from "@/components/marketing/Container";
import {
  AnnotatedStillVisual,
  StillVisualGallery,
  StillVisualGuidelines,
} from "@/components/marketing-visuals/AnnotatedStillVisual";
import ProductionVideoPlayer from "@/components/marketing-video/ProductionVideoPlayer";
import { coreStillVisuals } from "@/components/marketing-visuals/still-visual-system";
import { getProductionVideo, productionVideos } from "@/lib/video/production-videos";

const PAGES = [
  { href: "/demo/hero", label: "Hero (7.5s)", note: "Workflow komplett: Eingang bis Versand" },
  { href: "/demo/inbox", label: "Inbox (6.0s)", note: "Interessent vs. Systemmail" },
  { href: "/demo/rules", label: "Rules (6.5s)", note: "Auto / Freigabe / Ignorieren" },
  { href: "/demo/checks", label: "Checks (6.2s)", note: "Qualitätschecks vor Versand" },
  { href: "/demo/approve", label: "Approve (6.5s)", note: "Freigabe als Sicherheitsnetz" },
  { href: "/demo/product-hero", label: "Product Hero (7.5s)", note: "Hero-Loop für Produktseite" },
  { href: "/demo?view=stills", label: "Stills", note: "Annotiertes Still-Visual-System" },
  { href: "/demo?view=videos", label: "Videos", note: "2–3 Min Storyboards mit Captions und Exports" },
  { href: "/demo/tour/1-inbox", label: "Tour 1: Inbox", note: "Schritt 1/4 Eingang" },
  { href: "/demo/tour/2-rules", label: "Tour 2: Rules", note: "Schritt 2/4 Entscheidung" },
  { href: "/demo/tour/3-checks", label: "Tour 3: Checks", note: "Schritt 3/4 Fail-Safe" },
  { href: "/demo/tour/4-log", label: "Tour 4: Log", note: "Schritt 4/4 Verlauf" },
];

function withQuery(url: string, query: string) {
  return url.includes("?") ? `${url}&${query}` : `${url}?${query}`;
}

type SearchParams = Promise<{
  view?: string;
  id?: string;
  clean?: string;
  autoplay?: string;
  loop?: string;
}>;

export default async function DemoHubPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const isStillView = params.view === "stills";
  const isVideoView = params.view === "videos";
  const selected = params.id
    ? coreStillVisuals.find((item) => item.id === params.id)
    : null;
  const selectedVideo = params.id ? getProductionVideo(params.id) : null;
  const clean = params.clean === "1";
  const autoplay = params.autoplay === "1";
  const loopPlayback = params.loop === "1";

  if (isStillView && selected && clean) {
    return (
      <main className="min-h-screen bg-[#f5f1e6] px-6 py-10">
        <div className="mx-auto max-w-[1280px]" data-tour="annotated-still-root">
          <AnnotatedStillVisual visual={selected} compact />
        </div>
      </main>
    );
  }

  if (isStillView && selected) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb,#f4efe2)] py-14">
        <Container className="space-y-8">
          <section className="rounded-[30px] border border-[var(--border)] bg-white px-6 py-7 shadow-[var(--shadow-sm)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Still-Visual-System
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              Einzelmotiv-Vorschau
            </h1>
            <p className="mt-3 max-w-[70ch] text-sm leading-7 text-[var(--muted)]">
              Diese Detailansicht zeigt ein Motiv aus dem Kern-Screenshot-Set mit dem standardisierten Rahmen, den Pins und der Erklärlogik.
            </p>
          </section>

          <div data-tour="annotated-still-root">
            <AnnotatedStillVisual visual={selected} compact />
          </div>
        </Container>
      </main>
    );
  }

  if (isStillView) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb,#f4efe2)] py-14">
        <Container className="space-y-8">
          <section className="rounded-[30px] border border-[var(--border)] bg-white px-6 py-7 shadow-[var(--shadow-sm)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Sprint 3
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              Annotiertes Still-Visual-System
            </h1>
            <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--muted)]">
              Hier liegen die Regeln für alle stillen Produktvisuals: Browser-Rahmung, Statusfarben, Pin-Logik und eine Erklärspalte, die das Bild ruhig lässt.
            </p>
          </section>

          <StillVisualGuidelines />
          <StillVisualGallery />
        </Container>
      </main>
    );
  }

  if (isVideoView && selectedVideo && clean) {
    return (
      <main className="min-h-screen bg-[#07111d] px-4 py-6 md:px-6 md:py-8">
        <ProductionVideoPlayer
          video={selectedVideo}
          clean
          autoplay={autoplay}
          loopPlayback={loopPlayback}
        />
      </main>
    );
  }

  if (isVideoView && selectedVideo) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb,#f4efe2)] py-14">
        <Container className="space-y-8">
          <section className="rounded-[30px] border border-[var(--border)] bg-white px-6 py-7 shadow-[var(--shadow-sm)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Sprint 4
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              Produktionsvorschau
            </h1>
            <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--muted)]">
              Diese Ansicht bündelt Timeline, eingebrannte Caption-Fläche und die Export-Dateien für Poster, VTT und Voice-over.
            </p>
          </section>

          <ProductionVideoPlayer
            video={selectedVideo}
            autoplay={autoplay}
            loopPlayback={loopPlayback}
          />
        </Container>
      </main>
    );
  }

  if (isVideoView) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb,#f4efe2)] py-14">
        <Container className="space-y-8">
          <section className="rounded-[30px] border border-[var(--border)] bg-white px-6 py-7 shadow-[var(--shadow-sm)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Sprint 4
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
              Video-Produktionssuite
            </h1>
            <p className="mt-3 max-w-[72ch] text-sm leading-7 text-[var(--muted)]">
              Die drei Hauptvideos sind hier als interne Produktionsseiten mit denselben Assets, Captions und Voice-over-Dateien verfügbar, die später auch für Watch-Seiten und Social-Cutdowns dienen.
            </p>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {productionVideos.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
              >
                <img src={video.posterSource} alt={video.title} className="aspect-[16/10] w-full object-cover" />
                <div className="space-y-4 p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {video.eyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">
                      {video.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{video.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/demo?view=videos&id=${video.id}`} className="btn-secondary">
                      Vorschau
                    </Link>
                    <Link
                      href={`/demo?view=videos&id=${video.id}&clean=1&autoplay=1`}
                      className="btn-primary"
                    >
                      Record View
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </Container>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1120px] space-y-8 px-6 py-14 md:px-8">
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Marketing Demo Suite</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--text)]">Demo Hub</h1>
        <p className="mt-3 max-w-[72ch] text-sm text-[var(--muted)]">
          Alle Szenen sind record-ready. Für saubere Export-Loops nutze die Clean-Variante mit Autoplay und Loop.
        </p>
      </section>

      <section className="grid gap-4">
        {PAGES.map((page) => (
          <article
            key={page.href}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">{page.label}</h2>
                <p className="text-sm text-[var(--muted)]">{page.note}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={withQuery(page.href, "clean=1")} className="btn-secondary">
                  Open (clean)
                </Link>
                <Link href={withQuery(page.href, "clean=1&autoplay=1&loop=1")} className="btn-primary">
                  Open (autoplay+loop)
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)]">Record Tips</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--text)]">
          <li>macOS: `Shift + Cmd + 5` und „Record Selected Portion“ wählen.</li>
          <li>Format 16:9 aufnehmen, empfohlen: 1920×1080 oder 1280×720.</li>
          <li>URL mit `?clean=1&autoplay=1&loop=1` verwenden.</li>
          <li>Optional `&duration=6500` oder `&scale=0.95` für Feintuning nutzen.</li>
        </ol>
      </section>
    </main>
  );
}
