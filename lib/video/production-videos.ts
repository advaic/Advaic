import videoData from "@/lib/video/production-videos.json";

export type ProductionVideoScene = {
  id: string;
  type: "still" | "loop";
  src: string;
  poster?: string;
  durationMs: number;
  chapter: string;
  title: string;
  body: string;
  bullets: string[];
  subtitle: string;
};

export type ProductionVideo = {
  id: string;
  title: string;
  slug: string;
  eyebrow: string;
  summary: string;
  primaryCta: string;
  secondaryCta: string;
  posterSource: string;
  voice: string;
  rate: number;
  briefPath: string;
  scenes: ProductionVideoScene[];
};

type ProductionVideoPayload = {
  videos: ProductionVideo[];
};

const payload = videoData as ProductionVideoPayload;

export const productionVideos = payload.videos;

export function getProductionVideo(id: string) {
  return productionVideos.find((video) => video.id === id) ?? null;
}

export function getProductionVideoRuntimeMs(video: ProductionVideo) {
  return video.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
}

export function getProductionVideoProgressStops(video: ProductionVideo) {
  let offset = 0;
  return video.scenes.map((scene) => {
    const startMs = offset;
    const endMs = offset + scene.durationMs;
    offset = endMs;
    return {
      sceneId: scene.id,
      startMs,
      endMs,
    };
  });
}
