// Place at: lib/config.ts
import type { Lang } from "./types";

// Default location = CUSB (Panchanpur, Gaya). Ye approximate hai –
// Google Maps me CUSB pe right-click karke exact lat/lng copy karke yahan badal dena.
export const DEFAULT_LOCATION = { name: "CUSB, Gaya", lat: 24.9617, lng: 84.8373 };

export const LANGS: { code: Lang; label: string; speechLang: string }[] = [
  { code: "hi", label: "हिंदी", speechLang: "hi-IN" },
  { code: "bh", label: "भोजपुरी", speechLang: "hi-IN" }, // browser me Bhojpuri voice nahi hoti, Hindi voice use hogi
  { code: "en", label: "Eng", speechLang: "en-IN" },
];

// Bina API key ke chalne wala Google Maps search link
export const janAushadhiMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/Jan+Aushadhi+Kendra/@${lat},${lng},14z`;

export const COLORS = {
  bg: "#F8FAFC",
  primary: "#0D9488", // Trust Medical Teal
  success: "#16A34A", // Jan-Aushadhi Green
  danger: "#DC2626", // Suraksha Red
  voice: "#EA580C", // Marigold Orange
};
