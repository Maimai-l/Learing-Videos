// All scene layers of the video, in chapter order.
import { buildTitle } from './s0_title.js';
import { build1 } from './s1.js';
import { build2 } from './s2.js';
import { build3 } from './s3.js';
import { build4 } from './s4.js';
import { build5 } from './s5.js';
import { build6 } from './s6.js';
import { build7 } from './s7.js';

export function buildLayers(N) {
  return [
    ...buildTitle(N), ...build1(N), ...build2(N).layers, ...build3(N).layers, ...build4(N).layers,
    ...build5(N).layers, ...build6(N).layers, ...build7(N).layers,
  ];
}
