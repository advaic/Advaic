import { notFound } from "next/navigation";

import MarketingVideoWatchPage from "@/components/marketing-video/MarketingVideoWatchPage";
import { buildVideoWatchMetadata, readVideoTranscript } from "@/lib/video/watch-page-server";
import { getVideoWatchPayload } from "@/lib/video/watch-pages";

export const metadata = buildVideoWatchMetadata("tagesgeschaeft");

export default function DemoTagesgeschaeftPage() {
  const page = getVideoWatchPayload("tagesgeschaeft");
  if (!page) {
    notFound();
  }

  return (
    <MarketingVideoWatchPage
      page={page}
      transcriptParagraphs={readVideoTranscript("tagesgeschaeft")}
    />
  );
}
