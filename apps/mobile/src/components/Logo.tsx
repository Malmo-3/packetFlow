/**
 * Logo — the PacketFlow isometric box mark + wordmark, as inline SVG.
 * Ported from the web app's adaptive Logo; the colour follows the current
 * theme's foreground so it works on light and dark backgrounds.
 */
import Svg, { Polygon, Text as SvgText } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";

export function Logo({ height = 32, color }: { height?: number; color?: string }) {
  const { colors } = useTheme();
  const fg = color ?? colors.foreground;
  const width = (height / 56) * 196;

  return (
    <Svg width={width} height={height} viewBox="0 0 196 56">
      <Polygon points="32,11 56,24 32,37 8,24" fill={fg} opacity={0.35} />
      <Polygon points="8,24 32,37 32,55 8,42" fill={fg} opacity={0.6} />
      <Polygon points="32,37 56,24 56,42 32,55" fill={fg} opacity={1} />
      <SvgText
        x={68}
        y={40}
        fontSize={22}
        fontWeight="700"
        fill={fg}
        letterSpacing={-0.5}
      >
        PacketFlow
      </SvgText>
    </Svg>
  );
}

export default Logo;
