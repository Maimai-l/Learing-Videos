// All scene layers of the video, in chapter order.
import { buildTitle } from './s0_title.js';
import { build1 } from './s1.js';

export function buildLayers(N) {
  return [...buildTitle(N), ...build1(N)];
}
