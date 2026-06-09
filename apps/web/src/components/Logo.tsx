/**
 * Logo — the PacketFlow wordmark + isometric box mark.
 *
 * Rendered as inline SVG that paints with `currentColor`, so it automatically
 * adapts to whatever text colour its container sets. This means a single
 * component works on light backgrounds, dark backgrounds, and the inverting
 * marketing panels — no manual light/dark file swapping (which previously
 * failed to switch in dark mode).
 *
 * Usage:
 * ```tsx
 * <Logo className="h-9 w-auto" />              // follows surrounding text colour
 * <div className="text-background"><Logo /></div>  // forces a specific colour
 * ```
 *
 * The three box faces use graded opacity of `currentColor` to preserve the
 * isometric depth while staying monochrome and theme-agnostic.
 */
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 196 56"
      role="img"
      aria-label="PacketFlow"
      className={cn("text-foreground", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>PacketFlow</title>
      {/* Isometric box mark — graded opacity of currentColor for depth */}
      <polygon points="32,11 56,24 32,37 8,24" fill="currentColor" opacity="0.35" />
      <polygon points="8,24 32,37 32,55 8,42" fill="currentColor" opacity="0.6" />
      <polygon points="32,37 56,24 56,42 32,55" fill="currentColor" opacity="1" />
      {/* Wordmark */}
      <text
        x="68"
        y="40"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        PacketFlow
      </text>
    </svg>
  );
}

export default Logo;
