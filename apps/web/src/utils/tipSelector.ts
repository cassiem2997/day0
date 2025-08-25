import type { Tip } from "../data/tips";
import { TIPS } from "../data/tips";

export function pickRandomTipAny(): Tip {
  const idx = Math.floor(Math.random() * TIPS.length);
  return TIPS[idx];
}
