import { notFound } from "next/navigation";

import MarketingVideoWatchPage from "@/components/marketing-video/MarketingVideoWatchPage";
import { buildVideoWatchMetadata, readVideoTranscript } from "@/lib/video/watch-page-server";
import { getVideoWatchPayload } from "@/lib/video/watch-pages";

export const metadata = buildVideoWatchMetadata("auto-vs-freigabe");

export default function DemoAutoVsFreigabePage() {
  const page = getVideoWatchPayload("auto-vs-freigabe");
  if (!page) {
    notFound();
  }

  return (
    <MarketingVideoWatchPage
      page={page}
      transcriptParagraphs={readVideoTranscript("auto-vs-freigabe")}
    />
  );
}
