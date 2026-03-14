import { notFound } from "next/navigation";

import MarketingVideoWatchPage from "@/components/marketing-video/MarketingVideoWatchPage";
import { buildVideoWatchMetadata, readVideoTranscript } from "@/lib/video/watch-page-server";
import { getVideoWatchPayload } from "@/lib/video/watch-pages";

export const metadata = buildVideoWatchMetadata("qualitaetschecks-followups");

export default function DemoQualitaetschecksFollowupsPage() {
  const page = getVideoWatchPayload("qualitaetschecks-followups");
  if (!page) {
    notFound();
  }

  return (
    <MarketingVideoWatchPage
      page={page}
      transcriptParagraphs={readVideoTranscript("qualitaetschecks-followups")}
    />
  );
}
