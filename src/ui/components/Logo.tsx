import { Box, Text } from "ink";
import { LOGO_LINES } from "../logo";
import { COLOR, RULE, accentRamp, lerpHex } from "../theme";

/**
 * The block wordmark, shaded with a per-character emboss gradient. Rows sweep
 * bright→brand across each line and sink toward shadow from top to bottom, so
 * the wordmark reads as one lit material at any height (2 rows or 5). Colors
 * derive at render, so it follows the active theme.
 */
export function Logo({ lines = LOGO_LINES }: { lines?: readonly string[] } = {}) {
  const ramp = accentRamp();
  const shadeFrom = lerpHex(COLOR.accent, RULE, 0.35);
  const shadeTo = lerpHex(COLOR.accent, RULE, 0.65);
  const rows = Math.max(1, lines.length - 1);
  return (
    <Box flexDirection="column">
      {lines.map((line, row) => {
        // Vertical position 0 (top, lit) → 1 (bottom, shadow).
        const v = lines.length > 1 ? row / rows : 0;
        const from = lerpHex(ramp[1], shadeFrom, v);
        const to = lerpHex(ramp[0], shadeTo, v);
        const chars = [...line];
        const last = Math.max(1, chars.length - 1);
        return (
          <Box key={row}>
            {chars.map((ch, i) => (
              <Text key={i} bold color={lerpHex(from, to, i / last)}>
                {ch}
              </Text>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
