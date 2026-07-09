import { Box, Text } from "ink";
import { LOGO_LINES } from "../logo";
import { COLOR, RULE, accentRamp, lerpHex } from "../theme";

/** The block wordmark, shaded with a per-character emboss gradient. */
export function Logo() {
  // Top row catches the light (the shared accent ramp, bright → brand), the
  // bottom row falls into shadow (accent sunk toward the rule gray). Derived
  // at render so the wordmark follows the active theme.
  const ramp = accentRamp();
  const gradient: readonly [string, string][] = [
    [ramp[1], ramp[0]],
    [lerpHex(COLOR.accent, RULE, 0.35), lerpHex(COLOR.accent, RULE, 0.65)],
  ];
  return (
    <Box flexDirection="column">
      {LOGO_LINES.map((line, row) => {
        const [from, to] = gradient[Math.min(row, gradient.length - 1)]!;
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
