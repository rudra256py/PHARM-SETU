// Nearest Jan Aushadhi Kendras (with phone numbers) for the "Call Kendra" button.
// Needs GOOGLE_PLACES_API_KEY (Google Maps Platform -> "Places API (New)"). Without it the app falls back to the national helpline + map.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const JA = /jan\s*-?\s*aushadhi|janaushadhi|जन\s*औषधि|जनऔषधि|pmbjp|pmbi/i; // keep only real Kendras, never a random chemist
const cache = new Map<string, { at: number; kendras: unknown[] }>();
const hits = new Map<string, { n: number; t: number }>();

type Place = {
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  location?: { latitude: number; longitude: number };
};

const distKm = (a: number, b: number, c: number, d: number) => {
  const r = Math.PI / 180, x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ ok: false, code: "NO_KEY" });

  // small per-IP limit so nobody can burn your Google quota
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.t < 60_000) { if (++h.n > 12) return NextResponse.json({ ok: false, code: "SLOW_DOWN" }, { status: 429 }); }
  else { if (hits.size > 500) hits.clear(); hits.set(ip, { n: 1, t: now }); }

  const lat = Number(req.nextUrl.searchParams.get("lat")), lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6 || lat > 38 || lng < 68 || lng > 98)
    return NextResponse.json({ ok: false, code: "BAD_LOCATION" }, { status: 400 });

  const ck = `${lat.toFixed(2)},${lng.toFixed(2)}`; // ~1 km grid: same area = cached answer, saves Google cost
  const c = cache.get(ck);
  if (c && now - c.at < 6 * 3600_000) return NextResponse.json({ ok: true, kendras: c.kendras });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.location",
      },
      body: JSON.stringify({
        textQuery: "Jan Aushadhi Kendra", regionCode: "IN", languageCode: "en", maxResultCount: 10,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 15000 } },
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) { console.error("[kendra] places", res.status); return NextResponse.json({ ok: false, code: "PLACES_ERROR" }); }
    const places = ((await res.json()) as { places?: Place[] }).places ?? [];
    const kendras = places
      .filter((p) => JA.test(p.displayName?.text ?? ""))
      .map((p) => ({
        name: p.displayName?.text ?? "Jan Aushadhi Kendra",
        address: p.formattedAddress ?? "",
        phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
        km: p.location ? Math.round(distKm(lat, lng, p.location.latitude, p.location.longitude) * 10) / 10 : null,
        maps: p.googleMapsUri ?? "",
      }))
      .sort((a, b) => (a.km ?? 99) - (b.km ?? 99))
      .slice(0, 4);
    cache.set(ck, { at: now, kendras });
    return NextResponse.json({ ok: true, kendras });
  } catch (e) {
    console.error("[kendra]", (e as Error)?.message);
    return NextResponse.json({ ok: false, code: "PLACES_ERROR" });
  }
}
