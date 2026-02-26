import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Advaic",
    short_name: "Advaic",
    description: "Autopilot für Interessenten-Anfragen mit Guardrails, Freigabe und Qualitätschecks.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b0f17",
    icons: [
      {
        src: "/brand/advaic-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/advaic-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
