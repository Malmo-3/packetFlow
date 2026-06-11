/**
 * TrackingMap — a self-contained SVG map of Skåne for live package tracking.
 *
 * No external map library, tiles, or API keys: it projects approximate
 * lat/lng coordinates of the Skåne municipalities (and the package's real scan
 * coordinates) onto a stylised outline of the region. This keeps it fast,
 * offline-friendly, and fully themeable via Tailwind colour utilities.
 *
 * It draws:
 *  - the Skåne landmass outline
 *  - the pickup → destination route (solid where travelled, dashed ahead)
 *  - each recorded scan as a checkpoint dot
 *  - a pulsing marker at the package's current/last-known position
 */
import type { Scan } from "@packetflow/types";
import type { PackageStatus } from "@packetflow/types";

// Approximate city-centre coordinates (decimal degrees) for the 33 Skåne
// municipalities PacketFlow operates in.
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Bjuv: { lat: 56.083, lng: 12.917 },
  Bromölla: { lat: 56.072, lng: 14.47 },
  Burlöv: { lat: 55.637, lng: 13.083 },
  Båstad: { lat: 56.426, lng: 12.851 },
  Eslöv: { lat: 55.839, lng: 13.303 },
  Helsingborg: { lat: 56.046, lng: 12.694 },
  Hässleholm: { lat: 56.159, lng: 13.766 },
  Höganäs: { lat: 56.199, lng: 12.557 },
  Hörby: { lat: 55.853, lng: 13.66 },
  Höör: { lat: 55.934, lng: 13.541 },
  Klippan: { lat: 56.135, lng: 13.131 },
  Kristianstad: { lat: 56.029, lng: 14.157 },
  Kävlinge: { lat: 55.798, lng: 13.11 },
  Landskrona: { lat: 55.87, lng: 12.83 },
  Lomma: { lat: 55.677, lng: 13.069 },
  Lund: { lat: 55.704, lng: 13.191 },
  Malmö: { lat: 55.605, lng: 13.003 },
  Osby: { lat: 56.382, lng: 13.991 },
  Perstorp: { lat: 56.135, lng: 13.396 },
  Simrishamn: { lat: 55.557, lng: 14.345 },
  Sjöbo: { lat: 55.633, lng: 13.703 },
  Skurup: { lat: 55.474, lng: 13.503 },
  Staffanstorp: { lat: 55.64, lng: 13.209 },
  Svalöv: { lat: 55.913, lng: 13.11 },
  Svedala: { lat: 55.51, lng: 13.236 },
  Tomelilla: { lat: 55.543, lng: 13.951 },
  Trelleborg: { lat: 55.376, lng: 13.157 },
  Vellinge: { lat: 55.471, lng: 13.021 },
  Ystad: { lat: 55.429, lng: 13.82 },
  Åstorp: { lat: 56.134, lng: 12.944 },
  Ängelholm: { lat: 56.243, lng: 12.862 },
  Örkelljunga: { lat: 56.283, lng: 13.277 },
};

// Fixed bounding box covering Skåne, with a little margin.
const BBOX = { minLng: 12.35, maxLng: 14.65, minLat: 55.3, maxLat: 56.55 };
const W = 640;
const H = 420;
const PAD = 30;

function project(lat: number, lng: number) {
  const x = PAD + ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * (W - 2 * PAD);
  const y = PAD + ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * (H - 2 * PAD);
  return { x, y };
}

// Rough Skåne coastline/border outline as [lat, lng] pairs (clockwise).
const SKANE_OUTLINE: Array<[number, number]> = [
  [56.43, 12.72],
  [56.5, 13.5],
  [56.43, 14.0],
  [56.18, 14.56],
  [55.92, 14.32],
  [55.55, 14.36],
  [55.4, 13.82],
  [55.34, 13.36],
  [55.36, 13.0],
  [55.43, 12.82],
  [55.7, 12.95],
  [55.88, 12.8],
  [56.05, 12.66],
  [56.3, 12.46],
];

const outlinePath =
  SKANE_OUTLINE.map(([lat, lng], i) => {
    const { x, y } = project(lat, lng);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";

interface TrackingMapProps {
  pickupCity?: string;
  destinationCity?: string;
  scans: Scan[];
  status: PackageStatus;
  /** Ordered trip cities [start, ...stops, end]. When given, every stop is shown. */
  journey?: string[];
  /** The carrier's current position within `journey`. */
  currentStopIndex?: number;
}

export function TrackingMap({
  pickupCity,
  destinationCity,
  scans,
  status,
  journey,
  currentStopIndex = 0,
}: TrackingMapProps) {
  const delivered = status === "delivered";

  // ── Journey mode: plot every stop on the trip + the carrier's position ──
  const cityPoints = (journey ?? [])
    .map((city) => ({ city, coord: CITY_COORDS[city] }))
    .filter((c): c is { city: string; coord: { lat: number; lng: number } } => Boolean(c.coord))
    .map((c) => ({ city: c.city, ...project(c.coord.lat, c.coord.lng) }));

  if (cityPoints.length >= 2) {
    const lastIdx = cityPoints.length - 1;
    const curIdx = delivered ? lastIdx : Math.min(Math.max(currentStopIndex, 0), lastIdx);
    const seg = (a: number, b: number) =>
      cityPoints.slice(a, b + 1).map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const travelledD = curIdx > 0 ? seg(0, curIdx) : "";
    const remainingD = curIdx < lastIdx ? seg(curIdx, lastIdx) : "";
    const cur = cityPoints[curIdx];

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full select-none rounded-lg border border-border bg-secondary/30"
        role="img"
        aria-label="Live trip tracking map"
      >
        <path d={outlinePath} className="fill-muted stroke-border" strokeWidth={1.5} />
        {remainingD && (
          <path d={remainingD} className="stroke-muted-foreground" strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round" fill="none" opacity={0.6} />
        )}
        {travelledD && (
          <path d={travelledD} className="stroke-foreground" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
        {cityPoints.map((p, i) => {
          const passed = i < curIdx;
          const isCurrent = i === curIdx;
          const cls = passed
            ? "fill-green-500 stroke-foreground"
            : isCurrent
            ? "fill-foreground stroke-foreground"
            : "fill-card stroke-foreground";
          return (
            <g key={`${p.city}-${i}`}>
              <circle cx={p.x} cy={p.y} r={isCurrent ? 6 : 4.5} className={cls} strokeWidth={2} />
              <text
                x={p.x}
                y={i % 2 === 0 ? p.y - 10 : p.y + 18}
                textAnchor="middle"
                className={isCurrent ? "fill-foreground" : "fill-muted-foreground"}
                fontSize={11}
                fontWeight={isCurrent ? 700 : 500}
              >
                {p.city}
              </text>
            </g>
          );
        })}
        {!delivered && (
          <g>
            <circle cx={cur.x} cy={cur.y} r={6} className="fill-foreground" opacity={0.25}>
              <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={cur.x} cy={cur.y} r={5} className="fill-foreground stroke-card" strokeWidth={2} />
          </g>
        )}
      </svg>
    );
  }

  const origin = pickupCity ? CITY_COORDS[pickupCity] : undefined;
  const dest = destinationCity ? CITY_COORDS[destinationCity] : undefined;

  if (!origin || !dest) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Route map unavailable for this package.
      </div>
    );
  }

  // Valid scans = those with real coordinates inside the Skåne bbox, oldest→newest.
  const validScans = [...scans]
    .filter(
      (s) =>
        s.lat >= BBOX.minLat &&
        s.lat <= BBOX.maxLat &&
        s.lng >= BBOX.minLng &&
        s.lng <= BBOX.maxLng,
    )
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

  // The full ordered list of waypoints: origin → scans → destination.
  const originPt = project(origin.lat, origin.lng);
  const destPt = project(dest.lat, dest.lng);
  const scanPts = validScans.map((s) => ({ ...project(s.lat, s.lng), scan: s }));

  // Travelled path = origin through all scans (and to destination if delivered).
  const travelledPts = [originPt, ...scanPts.map((p) => ({ x: p.x, y: p.y }))];
  if (delivered) travelledPts.push(destPt);
  const travelledD = travelledPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Remaining path = current position → destination (only if not delivered).
  const current = travelledPts[travelledPts.length - 1];
  const remainingD = delivered ? "" : `M${current.x},${current.y} L${destPt.x},${destPt.y}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none rounded-lg border border-border bg-secondary/30"
      role="img"
      aria-label={`Live tracking map from ${pickupCity} to ${destinationCity}`}
    >
      {/* Skåne landmass */}
      <path d={outlinePath} className="fill-muted stroke-border" strokeWidth={1.5} />

      {/* Remaining route (dashed, ahead of the package) */}
      {remainingD && (
        <path
          d={remainingD}
          className="stroke-muted-foreground"
          strokeWidth={2}
          strokeDasharray="5 6"
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
      )}

      {/* Travelled route (solid) */}
      {travelledPts.length > 1 && (
        <path
          d={travelledD}
          className="stroke-foreground"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {/* Scan checkpoints */}
      {scanPts.map((p) => (
        <circle
          key={p.scan.id}
          cx={p.x}
          cy={p.y}
          r={3.5}
          className="fill-card stroke-foreground"
          strokeWidth={2}
        />
      ))}

      {/* Origin marker */}
      <g>
        <circle cx={originPt.x} cy={originPt.y} r={5} className="fill-foreground" />
        <text
          x={originPt.x}
          y={originPt.y - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          {pickupCity}
        </text>
      </g>

      {/* Destination marker (ring) */}
      <g>
        <circle
          cx={destPt.x}
          cy={destPt.y}
          r={6}
          className={delivered ? "fill-foreground" : "fill-card stroke-foreground"}
          strokeWidth={2.5}
        />
        <text
          x={destPt.x}
          y={destPt.y + 20}
          textAnchor="middle"
          className="fill-foreground"
          fontSize={12}
          fontWeight={600}
        >
          {destinationCity}
        </text>
      </g>

      {/* Current/live position marker with pulse (hidden once delivered) */}
      {!delivered && (
        <g>
          <circle cx={current.x} cy={current.y} r={6} className="fill-foreground" opacity={0.25}>
            <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={current.x} cy={current.y} r={5} className="fill-foreground stroke-card" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
}

export default TrackingMap;
