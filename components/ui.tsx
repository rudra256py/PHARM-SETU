// Place at: components/ui.tsx
// PHARM SETU ki design pehchan: Logo (pul + plus), icons, dawai ka 3-khane wala dibba, scan illustration.

const PATHS = {
  camera: ["M4 8h3l1.5-2h7L17 8h3v11H4z", "M12 9.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"],
  image: ["M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z", "M9 8.2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z", "M4 18l5-5 4 4 3-3 4 4"],
  speaker: ["M4 9v6h4l5 4V5L8 9z", "M16.5 8.5a5 5 0 010 7", "M19 6a8.5 8.5 0 010 12"],
  chat: ["M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z", "M9 8c0 3.5 3 6.5 6.5 6.5l1.2-1.6-2.2-1.2-.9.9c-1-.4-1.9-1.3-2.3-2.3l.9-.9L10.9 7z"],
  shield: ["M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z", "M9 12l2 2 4-4"],
  alert: ["M12 4L2.5 20h19z", "M12 10v4", "M12 17v.5"],
  pin: ["M12 21s7-6 7-11.5a7 7 0 10-14 0C5 15 12 21 12 21z", "M12 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"],
  sunrise: ["M3 19h18", "M7 19a5 5 0 0110 0", "M12 6v4", "M5.6 10.6l1.4 1.4", "M18.4 10.6L17 12"],
  sun: ["M12 8a4 4 0 100 8 4 4 0 000-8z", "M12 2v2", "M12 20v2", "M2 12h2", "M20 12h2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M19.1 4.9l-1.4 1.4", "M6.3 17.7l-1.4 1.4"],
  moon: ["M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"],
  pill: ["M10.5 20.5a4.95 4.95 0 01-7-7l10-10a4.95 4.95 0 017 7z", "M8.5 8.5l7 7"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  clock: ["M12 3a9 9 0 100 18 9 9 0 000-18z", "M12 7v5l3 2"],
  search: ["M11 4a7 7 0 100 14 7 7 0 000-14z", "M20 20l-4-4"],
  mic: ["M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3z", "M5 11a7 7 0 0014 0", "M12 18v3"],
  back: ["M15 5l-7 7 7 7"],
  chev: ["M9 5l7 7-7 7"],
  rupee: ["M7 5h10", "M7 9h10", "M8 5c5 0 7 2 7 4s-2 4-7 4l7 6"],
  doc: ["M7 3h8l4 4v14H7z", "M15 3v4h4", "M10 12h6", "M10 16h6"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name].map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

// Logo: pul (bridge) ka arch, aur uski chaabi (keystone) ki jagah medical plus
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label="PHARM SETU">
      <rect width="48" height="48" rx="13" fill="#0D9488" />
      <path d="M8 33Q24 8 40 33" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 25.4V33M19 21.7V33M29 21.7V33M34 25.4V33" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".8" />
      <path d="M5 33h38" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 9.5v9M19.5 14h9" stroke="#FDBA74" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M10 39c5 2.4 9 2.4 14 0s9-2.4 14 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

// Dawai ka dibba: subah / dopahar / raat – jisme goli hai wo khana bhara dikhta hai
export function PillBox({ schedule, labels }: { schedule: { morning: number; afternoon: number; night: number }; labels: readonly string[] }) {
  const slots: { n: number; icon: IconName }[] = [
    { n: schedule.morning, icon: "sunrise" },
    { n: schedule.afternoon, icon: "sun" },
    { n: schedule.night, icon: "moon" },
  ];
  return (
    <div className="pillbox" role="group">
      {slots.map((s, i) => (
        <div key={i} className={"cell " + (s.n > 0 ? "on" : "off")}>
          <Icon name={s.icon} size={24} />
          <span>{labels[i]}</span>
          <span className="dose">{s.n > 0 ? (<><Icon name="pill" size={18} />×{s.n}</>) : <Icon name="x" size={18} />}</span>
        </div>
      ))}
    </div>
  );
}

// Parchi + scan ke kone (brackets) + chalti hui scan-line
export function ScanArt({ loop = false }: { loop?: boolean }) {
  return (
    <svg className={"scanart" + (loop ? " loop" : "")} viewBox="0 0 96 112" width="88" height="102" aria-hidden="true">
      <path d="M18 14h40l20 20v64H18z" fill="#fff" stroke="#0A6B62" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M58 14v20h20" fill="none" stroke="#0A6B62" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="26" y="54" fontSize="20" fontWeight="800" fill="#0D9488" fontFamily="Georgia, serif">Rx</text>
      <rect x="26" y="64" width="44" height="4" rx="2" fill="#CFE5E2" />
      <rect x="26" y="74" width="34" height="4" rx="2" fill="#CFE5E2" />
      <rect x="26" y="84" width="40" height="4" rx="2" fill="#CFE5E2" />
      <path d="M8 26V8h18M70 8h18v18M88 86v18H70M26 104H8V86" fill="none" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect className="beam" x="12" y="14" width="72" height="3" rx="1.5" fill="#EA580C" />
    </svg>
  );
}
