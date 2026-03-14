import TrackedLink from "@/components/marketing/TrackedLink";
import Container from "@/components/marketing/Container";
import ProductionVideoPlayer from "@/components/marketing-video/ProductionVideoPlayer";
import type { VideoWatchPageConfig } from "@/lib/video/watch-pages";
import type { ProductionVideo } from "@/lib/video/production-videos";

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function groupChapters(video: ProductionVideo) {
  const groups: Array<{
    label: string;
    startMs: number;
    scenes: Array<{
      title: string;
      durationMs: number;
    }>;
  }> = [];

  let offset = 0;
  for (const scene of video.scenes) {
    const current = groups[groups.length - 1];
    if (current && current.label === scene.chapter) {
      current.scenes.push({
        title: scene.title,
        durationMs: scene.durationMs,
      });
    } else {
      groups.push({
        label: scene.chapter,
        startMs: offset,
        scenes: [
          {
            title: scene.title,
            durationMs: scene.durationMs,
          },
        ],
      });
    }
    offset += scene.durationMs;
  }

  return groups;
}

export default function MarketingVideoWatchPage({
  page,
  transcriptParagraphs,
}: {
  page: VideoWatchPageConfig & {
    video: ProductionVideo;
    runtimeMs: number;
  };
  transcriptParagraphs: string[];
}) {
  const chapters = groupChapters(page.video);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb,#f4efe2)] py-12 md:py-16">
      <Container className="space-y-8 md:space-y-10">
        <section className="rounded-[32px] border border-[var(--border)] bg-white px-6 py-7 shadow-[var(--shadow-sm)] md:px-8 md:py-9">
          <p className="section-kicker">{page.kicker}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1">
              Laufzeit: {formatTime(page.runtimeMs)}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1">
              Voice-over + Kapitel + Transkript
            </span>
          </div>
          <h1 className="mt-5 max-w-[18ch] text-4xl font-semibold tracking-[-0.05em] text-[var(--text)] md:text-6xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-[72ch] text-base leading-8 text-[var(--muted)] md:text-lg" data-tour="video-watch-intro">
            {page.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3" data-tour="video-watch-cta-row">
            <TrackedLink
              href={page.primaryCtaHref}
              event="video_watch_primary_click"
              pageGroup="video-watch"
              className="btn-primary"
              meta={{ video: page.slug }}
            >
              {page.primaryCtaLabel}
            </TrackedLink>
            <TrackedLink
              href={page.secondaryCtaHref}
              event="video_watch_secondary_click"
              pageGroup="video-watch"
              className="btn-secondary"
              meta={{ video: page.slug }}
            >
              {page.secondaryCtaLabel}
            </TrackedLink>
          </div>
        </section>

        <section data-tour="video-watch-player">
          <ProductionVideoPlayer video={page.video} clean controlsInline />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <article className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]" data-tour="video-watch-chapters">
            <p className="section-kicker">Kapitel</p>
            <div className="mt-5 space-y-4">
              {chapters.map((chapter) => (
                <div key={`${page.slug}-${chapter.label}`} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text)]">{chapter.label}</p>
                    <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-[var(--muted)]">
                      {formatTime(chapter.startMs)}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
                    {chapter.scenes.map((scene) => (
                      <li key={`${chapter.label}-${scene.title}`} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                        <span>{scene.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]" data-tour="video-watch-transcript">
            <p className="section-kicker">Transkript</p>
            <div className="mt-5 space-y-4">
              {transcriptParagraphs.map((paragraph, index) => (
                <p key={`${page.slug}-transcript-${index}`} className="text-sm leading-8 text-[var(--muted)] md:text-[15px]">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]" data-tour="video-watch-related">
          <p className="section-kicker">Weiterführend</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {page.relatedLinks.map((link) => (
              <TrackedLink
                key={link.href}
                href={link.href}
                event="video_watch_related_click"
                pageGroup="video-watch"
                className="group rounded-[22px] border border-[var(--border)] bg-[var(--surface-2)] p-4 transition hover:border-[rgba(201,162,39,0.4)] hover:bg-white"
                meta={{ video: page.slug, destination: link.href }}
              >
                <span className="block text-base font-semibold text-[var(--text)]">{link.title}</span>
                <span className="mt-2 block text-sm leading-7 text-[var(--muted)]">{link.text}</span>
              </TrackedLink>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
