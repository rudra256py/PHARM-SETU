// Place at: lib/types.ts  (app/api/decode/route.ts ke response se match karta hai)

export type Lang = "hi" | "en" | "bh";

export type Medicine = {
  brandName: string;
  genericSalt: string;
  strength: string | null;
  form: "tablet" | "capsule" | "syrup" | "injection" | "ointment" | "drops" | "other";
  purpose: string;
  sigOriginal: string | null; // jaise "1 BD PC"
  sigExplained: string; // jaise "1 BD (subah-shaam) PC (khane ke baad)"
  schedule: { morning: number; afternoon: number; night: number };
  timing: "empty_stomach" | "before_food" | "with_food" | "after_food" | "any";
  durationDays: number | null;
  foodWarnings: ("no_milk" | "no_alcohol" | "avoid_driving")[];
  speech: string; // bolkar sunane ke liye
  needsCheck: boolean;
};

export type Alert = {
  id: string;
  severity: "high" | "medium";
  medicines: string[];
  icons: string[];
  message: string;
};

export type DecodeSuccess = {
  ok: true;
  model: string;
  lang: Lang;
  readable: boolean;
  summarySpeech: string;
  medicines: Medicine[];
  alerts: Alert[];
};

export type DecodeFailure = {
  ok: false;
  code: string; // NO_IMAGE, TOO_BIG, NOT_READABLE, AI_UNAVAILABLE ...
  message: string;
  fallback: boolean; // true => UI ko sample parchi dikhani chahiye
};

export type DecodeResponse = DecodeSuccess | DecodeFailure;
