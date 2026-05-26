// Stable per-user accent color for chat sender labels.
// Same seed → same color across reloads.

const SENDER_COLORS = [
  "rgb(11,123,138)",   // teal-deep
  "rgb(14,116,144)",   // cyan-700
  "rgb(3,105,161)",    // sky-700
  "rgb(79,70,229)",    // indigo-600
  "rgb(124,58,237)",   // violet-600
  "rgb(192,38,211)",   // fuchsia-600
  "rgb(190,24,93)",    // pink-700
  "rgb(180,83,9)",     // amber-700
  "rgb(4,120,87)",     // emerald-700
  "rgb(190,18,60)",    // rose-700
];

export function senderColor(seed: string | null | undefined): string {
  if (!seed) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}
