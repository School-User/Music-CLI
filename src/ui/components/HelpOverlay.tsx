import { useMemo } from "react";
import { Box, Text } from "ink";
import { helpGroups } from "../keymap";
import { resolveKeybinds } from "../keybinds";
import { useStore } from "../store";
import { COLOR, RULE, lerpHex } from "../theme";

const KEY_GAP = 2;
const COL_GAP = 2;

/**
 * The full keyboard cheatsheet, shown only when the user presses `?`. Rendered
 * as a self-contained card: three columns on a roomy terminal, stacked when
 * narrow so nothing ever overlaps. Column geometry derives from the hints
 * themselves (which include any remapped player keys), so no key or label
 * ever wraps and a rebind re-sizes the card automatically.
 */
export function HelpOverlay() {
  const { cols, compact, config } = useStore();
  // The card border: divider gray warmed toward the accent, so the cheatsheet
  // reads as part of the brand without shouting over its contents. Derived at
  // render so it follows the active theme.
  const cardBorder = lerpHex(COLOR.accent, RULE, 0.55);

  const { groups, keyW, colW, cardW, keyWStacked } = useMemo(() => {
    const groups = helpGroups(resolveKeybinds(config.keybinds));
    const keyW = groups.map(
      (g) => Math.max(...g.hints.map((h) => h.keys.length)) + KEY_GAP,
    );
    const colW = groups.map(
      (g, i) => keyW[i]! + Math.max(...g.hints.map((h) => h.label.length)),
    );
    /** Width of the side-by-side card: columns + gaps + padding (2) + border (2). */
    const cardW =
      colW.reduce((a, b) => a + b, 0) + (groups.length - 1) * COL_GAP + 4;
    /** Stacked mode shares one key cell so the groups align down the page. */
    const keyWStacked = Math.max(...keyW);
    return { groups, keyW, colW, cardW, keyWStacked };
  }, [config]);

  const columns = cols >= cardW;

  return (
    <Box
      flexDirection="column"
      alignSelf="flex-start"
      borderStyle="round"
      borderColor={cardBorder}
      paddingX={columns ? 1 : 2}
      paddingY={compact ? 0 : 1}
    >
      <Box>
        <Text bold color={COLOR.accent}>
          Keyboard
        </Text>
        {/* Short terminals can't spare the standalone footer row, so the close
            hint rides the header instead of clipping off the bottom border. */}
        {compact ? <Text dimColor>{"  "}? esc to close</Text> : null}
      </Box>
      <Box
        marginTop={compact ? 0 : 1}
        flexDirection={columns ? "row" : "column"}
      >
        {groups.map((group, gi) => (
          <Box
            key={group.title}
            flexDirection="column"
            width={columns ? colW[gi] : undefined}
            marginRight={columns && gi < groups.length - 1 ? COL_GAP : 0}
            marginTop={!columns && gi > 0 ? 1 : 0}
          >
            <Text bold>{group.title}</Text>
            {group.hints.map((h) => (
              <Box key={h.keys + h.label}>
                <Box
                  width={columns ? keyW[gi] : keyWStacked}
                  flexShrink={0}
                >
                  <Text color={COLOR.alt}>{h.keys}</Text>
                </Box>
                <Text dimColor>{h.label}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      {compact ? null : (
        <Box marginTop={1}>
          <Text dimColor>Press ? or esc to close</Text>
        </Box>
      )}
    </Box>
  );
}
