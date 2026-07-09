import { memo, useMemo } from "react";
import { Text } from "ink";
import { COLOR, lerpHex } from "../theme";

/**
 * A progress fill that sweeps the accent ramp left→right, so progress reads
 * as a warm glow instead of a flat block. Filled cells get a per-cell color
 * along the ramp; the remainder stays a dim track. Always renders exactly
 * `width` cells so surrounding layout never shifts as it fills.
 */
export const GradientBar = memo(function GradientBar({
  pct,
  width,
}: {
  pct: number;
  width: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  // The per-cell lerp only depends on the integer cell count, so ticks that
  // land on the same cell reuse the same elements instead of re-lerping.
  // COLOR is read at render (not captured at module load) so the fill follows
  // a theme switch; the memo keys on the endpoints for the same reason.
  const cells = useMemo(() => {
    const last = Math.max(1, width - 1);
    return Array.from({ length: filled }, (_, i) => (
      <Text key={i} color={lerpHex(COLOR.accent, COLOR.amber, i / last)}>
        █
      </Text>
    ));
  }, [filled, width, COLOR.accent, COLOR.amber]);
  return (
    <Text>
      {cells}
      <Text dimColor>{"░".repeat(Math.max(0, width - filled))}</Text>
    </Text>
  );
});
