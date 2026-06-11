/**
 * TrackingMap — a self-contained SVG map of Skåne for live package tracking.
 * React Native port of apps/web/src/components/TrackingMap.tsx (react-native-svg).
 */
import React from "react";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { View } from "react-native";
import type { Scan } from "@packetflow/types";
import type { PackageStatus } from "@packetflow/types";
import { useTheme } from "../theme/ThemeProvider";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Bjuv: { lat: 56.083, lng: 12.917 }, Bromölla: { lat: 56.072, lng: 14.47 }, Burlöv: { lat: 55.637, lng: 13.083 },
  Båstad: { lat: 56.426, lng: 12.851 }, Eslöv: { lat: 55.839, lng: 13.303 }, Helsingborg: { lat: 56.046, lng: 12.694 },
  Hässleholm: { lat: 56.159, lng: 13.766 }, Höganäs: { lat: 56.199, lng: 12.557 }, Hörby: { lat: 55.853, lng: 13.66 },
  Höör: { lat: 55.934, lng: 13.541 }, Klippan: { lat: 56.135, lng: 13.131 }, Kristianstad: { lat: 56.029, lng: 14.157 },
  Kävlinge: { lat: 55.798, lng: 13.11 }, Landskrona: { lat: 55.87, lng: 12.83 }, Lomma: { lat: 55.677, lng: 13.069 },
  Lund: { lat: 55.704, lng: 13.191 }, Malmö: { lat: 55.605, lng: 13.003 }, Osby: { lat: 56.382, lng: 13.991 },
  Perstorp: { lat: 56.135, lng: 13.396 }, Simrishamn: { lat: 55.557, lng: 14.345 }, Sjöbo: { lat: 55.633, lng: 13.703 },
  Skurup: { lat: 55.474, lng: 13.503 }, Staffanstorp: { lat: 55.64, lng: 13.209 }, Svalöv: { lat: 55.913, lng: 13.11 },
  Svedala: { lat: 55.51, lng: 13.236 }, Tomelilla: { lat: 55.543, lng: 13.951 }, Trelleborg: { lat: 55.376, lng: 13.157 },
  Vellinge: { lat: 55.471, lng: 13.021 }, Ystad: { lat: 55.429, lng: 13.82 }, Åstorp: { lat: 56.134, lng: 12.944 },
  Ängelholm: { lat: 56.243, lng: 12.862 }, Örkelljunga: { lat: 56.283, lng: 13.277 },
};

const BBOX = { minLng: 12.35, maxLng: 14.65, minLat: 55.3, maxLat: 56.55 };
const W = 640, H = 420, PAD = 30;

function project(lat: number, lng: number) {
  const x = PAD + ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * (W - 2 * PAD);
  const y = PAD + ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * (H - 2 * PAD);
  return { x, y };
}

const OUTLINE: Array<[number, number]> = [
  [56.43, 12.72], [56.5, 13.5], [56.43, 14.0], [56.18, 14.56], [55.92, 14.32], [55.55, 14.36], [55.4, 13.82],
  [55.34, 13.36], [55.36, 13.0], [55.43, 12.82], [55.7, 12.95], [55.88, 12.8], [56.05, 12.66], [56.3, 12.46],
];
const outlinePath =
  OUTLINE.map(([lat, lng], i) => {
    const { x, y } = project(lat, lng);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";

export function TrackingMap({
  pickupCity,
  destinationCity,
  scans,
  status,
  journey,
  currentStopIndex = 0,
}: {
  pickupCity?: string;
  destinationCity?: string;
  scans: Scan[];
  status: PackageStatus;
  /** Ordered trip cities [start, ...stops, end]. When given, the map shows every stop. */
  journey?: string[];
  /** The carrier's current position within `journey`. */
  currentStopIndex?: number;
}) {
  const { colors } = useTheme();
  const delivered = status === "delivered";

  // Resolve the journey cities to coordinates (drop any we don't have coords for).
  const cityPoints = (journey ?? [])
    .map((city) => ({ city, coord: CITY_COORDS[city] }))
    .filter((c): c is { city: string; coord: { lat: number; lng: number } } => Boolean(c.coord))
    .map((c) => ({ city: c.city, ...project(c.coord.lat, c.coord.lng) }));

  const Frame = ({ children }: { children: React.ReactNode }) => (
    <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      <Svg width="100%" height={240} viewBox={`0 0 ${W} ${H}`}>
        <Path d={outlinePath} fill={colors.muted} stroke={colors.border} strokeWidth={1.5} />
        {children}
      </Svg>
    </View>
  );

  // ── Journey mode: plot every stop on the trip + the carrier's position ──
  if (cityPoints.length >= 2) {
    const lastIdx = cityPoints.length - 1;
    const curIdx = delivered ? lastIdx : Math.min(Math.max(currentStopIndex, 0), lastIdx);
    const d = (a: number, b: number) => cityPoints.slice(a, b + 1).map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const travelledD = curIdx > 0 ? d(0, curIdx) : "";
    const remainingD = curIdx < lastIdx ? d(curIdx, lastIdx) : "";
    const cur = cityPoints[curIdx];

    return (
      <Frame>
        {remainingD ? (
          <Path d={remainingD} stroke={colors.mutedForeground} strokeWidth={2} strokeDasharray="5,6" strokeLinecap="round" fill="none" opacity={0.6} />
        ) : null}
        {travelledD ? (
          <Path d={travelledD} stroke={colors.foreground} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ) : null}
        {cityPoints.map((p, i) => {
          const passed = i < curIdx;
          const isCurrent = i === curIdx;
          const fill = passed ? colors.success : isCurrent ? colors.foreground : colors.card;
          const labelAbove = i % 2 === 0;
          return (
            <React.Fragment key={`${p.city}-${i}`}>
              <Circle cx={p.x} cy={p.y} r={isCurrent ? 6 : 4.5} fill={fill} stroke={colors.foreground} strokeWidth={2} />
              <SvgText
                x={p.x}
                y={labelAbove ? p.y - 10 : p.y + 18}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isCurrent ? "700" : "500"}
                fill={isCurrent ? colors.foreground : colors.mutedForeground}
              >
                {p.city}
              </SvgText>
            </React.Fragment>
          );
        })}
        {!delivered ? <Circle cx={cur.x} cy={cur.y} r={5} fill={colors.foreground} stroke={colors.card} strokeWidth={2} /> : null}
      </Frame>
    );
  }

  // ── Fallback: pickup → destination with scan checkpoints ──
  const origin = pickupCity ? CITY_COORDS[pickupCity] : undefined;
  const dest = destinationCity ? CITY_COORDS[destinationCity] : undefined;
  if (!origin || !dest) return null;

  const validScans = [...scans]
    .filter((s) => s.lat >= BBOX.minLat && s.lat <= BBOX.maxLat && s.lng >= BBOX.minLng && s.lng <= BBOX.maxLng)
    .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

  const originPt = project(origin.lat, origin.lng);
  const destPt = project(dest.lat, dest.lng);
  const scanPts = validScans.map((s) => ({ ...project(s.lat, s.lng), id: s.id }));

  const travelled = [originPt, ...scanPts.map((p) => ({ x: p.x, y: p.y }))];
  if (delivered) travelled.push(destPt);
  const travelledD = travelled.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const current = travelled[travelled.length - 1];
  const remainingD = delivered ? "" : `M${current.x},${current.y} L${destPt.x},${destPt.y}`;

  return (
    <Frame>
      {remainingD ? (
        <Path d={remainingD} stroke={colors.mutedForeground} strokeWidth={2} strokeDasharray="5,6" strokeLinecap="round" fill="none" opacity={0.6} />
      ) : null}
      {travelled.length > 1 ? (
        <Path d={travelledD} stroke={colors.foreground} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : null}
      {scanPts.map((p) => (
        <Circle key={p.id} cx={p.x} cy={p.y} r={3.5} fill={colors.card} stroke={colors.foreground} strokeWidth={2} />
      ))}
      <Circle cx={originPt.x} cy={originPt.y} r={5} fill={colors.foreground} />
      <SvgText x={originPt.x} y={originPt.y - 10} textAnchor="middle" fontSize={12} fontWeight="600" fill={colors.foreground}>
        {pickupCity}
      </SvgText>
      <Circle cx={destPt.x} cy={destPt.y} r={6} fill={delivered ? colors.foreground : colors.card} stroke={colors.foreground} strokeWidth={2.5} />
      <SvgText x={destPt.x} y={destPt.y + 20} textAnchor="middle" fontSize={12} fontWeight="600" fill={colors.foreground}>
        {destinationCity}
      </SvgText>
      {!delivered ? <Circle cx={current.x} cy={current.y} r={5} fill={colors.foreground} stroke={colors.card} strokeWidth={2} /> : null}
    </Frame>
  );
}

export default TrackingMap;
