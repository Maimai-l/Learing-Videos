// Find when a phrase of the narration is spoken.
//
// Scenes refer to the narration by its words (as written in 旁白.txt), never by
// raw seconds, so a re-recorded narration only needs a new alignment.
const compactRe = /[\s，。、：；？！“”"（）()…;:?!]/; // ASCII "." kept: it is part of numbers like 1.8

export class Narration {
  constructor(tl) {
    this.tl = tl;
    this.missing = [];
    // per paragraph: compact text and map compact index -> original char index
    this.idx = tl.paragraphs.map((p) => {
      const map = [];
      let s = '';
      [...p.text].forEach((c, i) => {
        if (!compactRe.test(c)) {
          s += c;
          map.push(i);
        }
      });
      return { s, map };
    });
  }

  // Search paragraphs (optionally only those of one chapter) for a phrase.
  // o.after: only accept occurrences starting at or after this global time.
  // o.n: take the n-th occurrence (0-based) after o.after.
  find(phrase, o = {}) {
    const q = [...phrase].filter((c) => !compactRe.test(c)).join('');
    let seen = 0;
    for (let pi = 0; pi < this.tl.paragraphs.length; pi++) {
      const P = this.tl.paragraphs[pi];
      if (o.chapter && P.chapter !== o.chapter) continue;
      const { s, map } = this.idx[pi];
      let from = 0;
      for (;;) {
        const k = s.indexOf(q, from);
        if (k < 0) break;
        from = k + 1;
        const c0 = map[k], c1 = map[k + q.length - 1];
        const first = P.chars.slice(c0, c1 + 1).find(Boolean);
        const last = P.chars.slice(c0, c1 + 1).reverse().find(Boolean);
        if (!first) continue;
        if (o.after !== undefined && first[0] < o.after - 1e-6) continue;
        if (seen++ < (o.n || 0)) continue;
        return { t0: first[0], t1: last[1], para: pi };
      }
    }
    return null;
  }

  // start time of a phrase
  A(phrase, o = {}) {
    const r = this.find(phrase, o);
    if (!r) {
      this.missing.push(phrase);
      return o.fallback !== undefined ? o.fallback : 0;
    }
    return r.t0;
  }
  // end time of a phrase
  E(phrase, o = {}) {
    const r = this.find(phrase, o);
    if (!r) {
      this.missing.push(phrase);
      return o.fallback !== undefined ? o.fallback : 0;
    }
    return r.t1;
  }
  chapter(n) {
    const c = this.tl.chapters.find((x) => x.n === n);
    const self = this;
    return {
      ...c,
      A: (ph, o = {}) => self.A(ph, { chapter: n, ...o }),
      E: (ph, o = {}) => self.E(ph, { chapter: n, ...o }),
      para: (k) => self.tl.paragraphs[c.paras[k]],
    };
  }
}
