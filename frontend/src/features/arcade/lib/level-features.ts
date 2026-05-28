/**
 * Per-level feature summaries shown on the cinematic intro card before each
 * round. Level 1 includes a full "how to play" rundown; subsequent levels
 * list only what's NEW at that level so the patient sees the difference.
 *
 * Each entry is one short string with an optional emoji prefix — kept short
 * so the intro card stays readable at a glance during the 3-second countdown.
 */

import type { ArcadeGameType } from "@/features/arcade/services/arcade-api";

export type LevelFeature = {
  icon: string;
  text: string;
};

export type LevelBrief = {
  /** Headline shown above the feature list (e.g. "What's new"). */
  headline: string;
  features: LevelFeature[];
  /** Optional one-liner under the headline. */
  blurb?: string;
};

const PB_LEVELS: Record<number, LevelBrief> = {
  1: {
    headline: "How to play",
    blurb: "Tap targets as they appear. You have 30 seconds.",
    features: [
      { icon: "🦠", text: "Tap plaque — +10 points" },
      { icon: "✨", text: "Tap cavities — +50 points" },
      { icon: "❌", text: "Empty taps cost -5 and break combo" },
      { icon: "⏱️", text: "Every target has a decay ring — be quick" },
    ],
  },
  2: {
    headline: "New at Level 2",
    features: [
      { icon: "🪥", text: "Brushes appear — clean hit, +20 points" },
      { icon: "⚡", text: "Slightly faster spawn cadence" },
    ],
  },
  3: {
    headline: "New at Level 3",
    features: [
      { icon: "🍭", text: "Lollipops appear — DON'T tap, -50 if you do" },
      { icon: "🔥", text: "Combo broken on sugar or empty taps" },
    ],
  },
  4: {
    headline: "New at Level 4",
    features: [
      { icon: "⚡", text: "Spawn rate 30% faster" },
      { icon: "⏳", text: "Targets disappear sooner" },
    ],
  },
  5: {
    headline: "New at Level 5",
    features: [
      { icon: "💣", text: "Bombs appear — tap one and the round ENDS" },
      { icon: "🟥", text: "Bombs wobble with red glow — easy to spot" },
    ],
  },
  6: {
    headline: "New at Level 6",
    features: [
      { icon: "⏳", text: "Lifetimes shrink — react faster" },
      { icon: "🍬", text: "More sugar, more bombs" },
    ],
  },
  7: {
    headline: "New at Level 7",
    features: [
      { icon: "✌️", text: "Double-spawn — two targets land at once" },
      { icon: "⚡", text: "Even tighter spawn cadence" },
    ],
  },
  8: {
    headline: "New at Level 8",
    features: [
      { icon: "🌀", text: "Targets jitter on the grid — harder to focus" },
      { icon: "🍭", text: "Sugar share climbs to ~37%" },
    ],
  },
  9: {
    headline: "New at Level 9",
    features: [
      { icon: "🤘", text: "Triple-spawn — three targets at once possible" },
      { icon: "🔥", text: "Spawns every 300ms" },
    ],
  },
  10: {
    headline: "Maximum chaos",
    blurb: "Last fixed level. Everything cranked.",
    features: [
      { icon: "⚡", text: "230ms spawn cadence — relentless" },
      { icon: "⏳", text: "Half-second lifetimes" },
      { icon: "💣", text: "12% bomb share, 47% sugar share" },
      { icon: "🤘", text: "Triple-spawns are common" },
    ],
  },
  11: {
    headline: "♾️ Endless mode",
    blurb: "No timer. Difficulty climbs every 20 seconds. Bomb = game over.",
    features: [
      { icon: "♾️", text: "Open run — no fixed round duration" },
      { icon: "⚡", text: "Spawn cadence tightens with time" },
      { icon: "💣", text: "One bomb ends the run" },
      { icon: "🏆", text: "Push your best score as long as you can survive" },
    ],
  },
};

const TD_LEVELS: Record<number, LevelBrief> = {
  1: {
    headline: "How to play",
    blurb: "Click bacteria before they reach the tooth.",
    features: [
      { icon: "🦠", text: "Each kill scores points (25+ per kill)" },
      { icon: "❤️", text: "You start with 3 lives" },
      { icon: "💥", text: "If a bacteria hits the tooth: -1 life, -50 score" },
      { icon: "⭐", text: "First-shot kills earn a bonus +10" },
    ],
  },
  2: {
    headline: "New at Level 2",
    features: [
      { icon: "⚡", text: "Bacteria spawn faster" },
      { icon: "🏃", text: "Slightly quicker movement" },
    ],
  },
  3: {
    headline: "New at Level 3",
    features: [
      { icon: "💪", text: "Some bacteria take 2 shots to kill" },
      { icon: "⚡", text: "Faster spawn rate" },
    ],
  },
  4: {
    headline: "New at Level 4",
    features: [
      { icon: "🏃", text: "Bacteria move noticeably faster" },
      { icon: "🎯", text: "Tighter aim required" },
    ],
  },
  5: {
    headline: "New at Level 5",
    features: [
      { icon: "💪", text: "3-HP bacteria appear" },
      { icon: "⚡", text: "Spawn cadence 50% faster than Lv 1" },
    ],
  },
  6: {
    headline: "New at Level 6",
    features: [
      { icon: "🌀", text: "Bacteria approach in varied angles" },
      { icon: "🏃", text: "Movement speed climbs again" },
    ],
  },
  7: {
    headline: "New at Level 7",
    features: [
      { icon: "💪", text: "Tougher bacteria everywhere" },
      { icon: "⚡", text: "Rapid spawn rate" },
    ],
  },
  8: {
    headline: "New at Level 8",
    features: [
      { icon: "🤘", text: "Sustained waves — keep clicking" },
      { icon: "💪", text: "4-HP bacteria appear" },
    ],
  },
  9: {
    headline: "New at Level 9",
    features: [
      { icon: "🌪️", text: "Bacteria barely give breathing room" },
      { icon: "🏃", text: "Top-tier movement speed" },
    ],
  },
  10: {
    headline: "Maximum chaos",
    blurb: "Last fixed level. The swarm never stops.",
    features: [
      { icon: "💪", text: "Up to 5-HP bacteria" },
      { icon: "🏃", text: "Maximum speed + maximum spawn rate" },
      { icon: "🌪️", text: "Endless waves until you lose all 3 hearts" },
    ],
  },
  11: {
    headline: "♾️ Endless mode",
    blurb: "No level cap. Spawns + HP escalate every 25 seconds.",
    features: [
      { icon: "♾️", text: "Difficulty keeps climbing until you fall" },
      { icon: "💪", text: "Bacteria HP rises beyond Lv 10 max" },
      { icon: "❤️", text: "Still 3 lives — make them count" },
      { icon: "🏆", text: "Score as much as you can before the breach" },
    ],
  },
};

const FR_LEVELS: Record<number, LevelBrief> = {
  1: {
    headline: "How to play",
    blurb: "Switch lanes to collect items. Don't touch sugar.",
    features: [
      { icon: "↕️", text: "Arrow keys / WS / tap upper-middle-lower" },
      { icon: "🧵", text: "Collect floss for points" },
      { icon: "💧", text: "Water for points too" },
      { icon: "🍬", text: "Sugar = instant game over" },
    ],
  },
  2: {
    headline: "New at Level 2",
    features: [
      { icon: "🏃", text: "Lane scroll +20% faster" },
      { icon: "🦷", text: "Gold-tooth bonus pickups appear" },
    ],
  },
  3: {
    headline: "New at Level 3",
    features: [
      { icon: "🍬", text: "Sugar appears more often" },
      { icon: "⚡", text: "Quicker pickups" },
    ],
  },
  4: {
    headline: "New at Level 4",
    features: [
      { icon: "🏃", text: "Scroll speed climbs again" },
      { icon: "🎯", text: "Tighter dodge windows" },
    ],
  },
  5: {
    headline: "New at Level 5",
    features: [
      { icon: "🏃", text: "Scroll 50% faster than Lv 1" },
      { icon: "🍬", text: "Sugar share climbs sharply" },
    ],
  },
  6: {
    headline: "New at Level 6",
    features: [
      { icon: "🦷", text: "Gold-tooth gets rarer" },
      { icon: "🍬", text: "Sugar pairs in same lane" },
    ],
  },
  7: {
    headline: "New at Level 7",
    features: [
      { icon: "🏃", text: "Speed climbs into the danger zone" },
      { icon: "🌀", text: "Items spawn in patterns" },
    ],
  },
  8: {
    headline: "New at Level 8",
    features: [
      { icon: "🍬", text: "Chained sugar — multiple lanes blocked" },
      { icon: "🏃", text: "Reaction window tightens" },
    ],
  },
  9: {
    headline: "New at Level 9",
    features: [
      { icon: "🏃", text: "Near-max scroll speed" },
      { icon: "🤘", text: "Items come in dense rapid bursts" },
    ],
  },
  10: {
    headline: "Maximum chaos",
    blurb: "Last fixed level. Run for your life.",
    features: [
      { icon: "🏃", text: "Maximum scroll speed" },
      { icon: "🍬", text: "Sugar share peaks" },
      { icon: "⚡", text: "Items spawn in rapid-fire bursts" },
    ],
  },
  11: {
    headline: "♾️ Endless mode",
    blurb: "No level cap. Scroll speed climbs every 25 seconds.",
    features: [
      { icon: "♾️", text: "Open run — go as far as you can" },
      { icon: "🏃", text: "Scroll keeps accelerating" },
      { icon: "🍬", text: "Sugar density keeps climbing" },
      { icon: "🏆", text: "Distance + collectibles compound your score" },
    ],
  },
};

const TABLES: Record<ArcadeGameType, Record<number, LevelBrief>> = {
  PLAQUE_BLASTER: PB_LEVELS,
  TOOTH_DEFENDER: TD_LEVELS,
  FLOSS_RUSH: FR_LEVELS,
};

/**
 * Returns the intro brief for a given game + level. Falls back to a generic
 * "tougher" brief if the level isn't explicitly defined (shouldn't happen,
 * but keeps the intro card defensive).
 */
export function getLevelBrief(
  gameType: ArcadeGameType,
  level: number,
): LevelBrief {
  const table = TABLES[gameType];
  return (
    table[level] ?? {
      headline: `Level ${level}`,
      features: [
        { icon: "⚡", text: "Tougher spawns, faster cadence" },
      ],
    }
  );
}
