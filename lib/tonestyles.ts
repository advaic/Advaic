import { ToneStyle } from "./types";
export const toneStyles: ToneStyle[] = [
  {
    id: "freundlich",
    label: "Freundlich",
    description: "Ein netter, zugänglicher Ton.",
    example: "Hallo! Schön, dass Sie sich melden 😊",
    benefit: "Kommt sympathisch rüber und schafft Vertrauen.",
    name: "Freundlich",
    emoji: "😊",
  },
  {
    id: "professionell",
    label: "Professionell",
    description: "Förmlich und klar.",
    example: "Guten Tag, vielen Dank für Ihre Nachricht.",
    benefit: "Hinterlässt einen kompetenten Eindruck.",
    name: "Professionell",
    emoji: "💼",
  },
  {
    id: "direkt",
    label: "Direkt",
    description: "Klar, schnell, ohne Umschweife.",
    example: "Wollen Sie das Objekt besichtigen oder nicht?",
    benefit: "Spart Zeit und wirkt selbstbewusst.",
    name: "Direkt",
    emoji: "⚡️",
  },
];
