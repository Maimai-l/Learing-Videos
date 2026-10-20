// All scene layers of the video, in chapter order.
import { buildTitle } from './s0_title.js';
import { build1 } from './s1.js';
import { build2 } from './s2.js';
import { build3 } from './s3.js';
import { build4 } from './s4.js';
import { build5 } from './s5.js';
import { build6 } from './s6.js';
import { build7 } from './s7.js';
import { build8 } from './s8.js';
import { build9 } from './s9.js';

import { subtitleParts } from '../engine/draw.js';

export function buildLayers(N) {
  // the math in the subtitles is converted at build time too
  for (const c of N.tl.cues) subtitleParts(c.text);
  return [
    ...buildTitle(N), ...build1(N), ...build2(N).layers, ...build3(N).layers, ...build4(N).layers,
    ...build5(N).layers, ...build6(N).layers, ...build7(N).layers, ...build8(N).layers, ...build9(N).layers,
  ];
}
