#!/usr/bin/env python3
"""Subset the five font faces to the characters the page can draw.

    python3 tools/fonts.py           ->  build/fonts/*.woff2, fonts.json, charset.txt
    python3 tools/fonts.py --force   rebuild even when the character set has not changed

Characters collected:
  - subtitle cues and chapter titles in build/timeline.json
  - text inside formulas in build/tex.json
  - every character in src/**/*.{js,mjs,html,css} (scenes, player UI, quizzes)
  - ASCII, full-width punctuation, Greek letters, super/subscript digits, math symbols

Noto Sans SC / Noto Serif SC have no subscript digits (₀₁₂₃ appear in the
subtitles: n₁ − 1, μ₀, ε₁ ...) and only ¹²³ as superscripts. The missing ones are
added to every subset, drawn from the face's own glyphs: ₁₂₃ are its designed
superscripts moved below the baseline, the others are its digits scaled to the
same size.
"""
import hashlib
import json
import pathlib
import sys

from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
NM = ROOT / 'node_modules' / '@expo-google-fonts'
OUT = ROOT / 'build' / 'fonts'
VERSION = '1'  # bump when the subsetting itself changes

FACES = [
    # family, weight, source, output
    ('Noto Sans SC', 400, NM / 'noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf', 'NotoSansSC-400.woff2'),
    ('Noto Sans SC', 500, NM / 'noto-sans-sc/500Medium/NotoSansSC_500Medium.ttf', 'NotoSansSC-500.woff2'),
    ('Noto Sans SC', 700, NM / 'noto-sans-sc/700Bold/NotoSansSC_700Bold.ttf', 'NotoSansSC-700.woff2'),
    ('Noto Serif SC', 400, NM / 'noto-serif-sc/400Regular/NotoSerifSC_400Regular.ttf', 'NotoSerifSC-400.woff2'),
    ('Noto Serif SC', 600, NM / 'noto-serif-sc/600SemiBold/NotoSerifSC_600SemiBold.ttf', 'NotoSerifSC-600.woff2'),
]

EXTRA = (
    ''.join(chr(c) for c in range(0x20, 0x7F))  # ASCII printable
    + chr(0xA0)  # no-break space
    + ''.join(chr(c) for c in range(0x3000, 0x3020))  # CJK symbols and punctuation
    + ''.join(chr(c) for c in range(0xFF01, 0xFF5F))  # full-width forms
    + '，。、：；？！（）「」『』“”‘’《》〈〉【】〔〕…—–·・～'
    + 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω'
    + '⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉'
    + '−±×÷≈≠≤≥√∞∑∏∫∂∆∇∈∉⊂∪∩→←↑↓↔⇒⇔∝≡′″‰%°•'
    + chr(0x304) + chr(0x307)  # combining macron and dot above (x̄, ẋ)
)

SUB_BASE = -100  # baseline of subscript digits (font units, 1000 per em)


def collect():
    chars = set(EXTRA)
    tl = json.loads((ROOT / 'build/timeline.json').read_text('utf8'))
    for c in tl.get('cues', []):
        chars.update(c.get('text', ''))
    for c in tl.get('chapters', []):
        chars.update(c.get('title', '') + c.get('cn', ''))
    tex = ROOT / 'build/tex.json'
    if tex.exists():
        for f in json.loads(tex.read_text('utf8')).get('formulas', {}).values():
            for t in f.get('txt', []):
                chars.update(t.get('s', ''))
    for p in sorted((ROOT / 'src').rglob('*')):
        if p.is_file() and p.suffix in ('.js', '.mjs', '.html', '.css'):
            chars.update(p.read_text('utf8'))
    return ''.join(sorted(c for c in chars if ord(c) >= 0x20 and ord(c) != 0x7F and not 0xD800 <= ord(c) <= 0xDFFF))


def bounds(glyf, name):
    g = glyf[name]
    g.recalcBounds(glyf)
    return g.xMin, g.yMin, g.xMax, g.yMax


def add_glyph(font, name, src, scale, dx, dy, advance, codepoint):
    """New glyph: the outline of `src`, scaled by `scale` and moved by (dx, dy)."""
    gs = font.getGlyphSet()
    rec = DecomposingRecordingPen(gs)
    gs[src].draw(rec)
    pen = TTGlyphPen(None)
    rec.replay(TransformPen(pen, (scale, 0, 0, scale, dx, dy)))
    g = pen.glyph()
    glyf = font['glyf']
    glyf[name] = g
    g.recalcBounds(glyf)
    xmin, ymax = (g.xMin, g.yMax) if g.numberOfContours else (0, 0)
    font['hmtx'][name] = (round(advance), xmin)
    if 'vmtx' in font:
        font['vmtx'][name] = (1000, max(0, 880 - ymax))
    for t in font['cmap'].tables:
        if t.isUnicode():
            t.cmap[codepoint] = name


def add_scripts(font):
    """Add the subscript (and missing superscript) digits this face lacks."""
    cmap = font.getBestCmap()
    glyf = font['glyf']
    hmtx = font['hmtx']
    if 0xB2 not in cmap:
        return []
    digit = [cmap[0x30 + i] for i in range(10)]
    sup = {1: cmap.get(0xB9), 2: cmap[0xB2], 3: cmap.get(0xB3)}
    _, d0, _, d1 = bounds(glyf, digit[2])
    _, s0, _, s1 = bounds(glyf, sup[2])
    k = (s1 - s0) / (d1 - d0)  # size of the designed superscripts
    sup_base = s0
    adv = hmtx[sup[2]][0]
    added = []
    for i in range(10):
        for cp, base in ((0x2080 + i, SUB_BASE), ((0x2070 + i) if i not in (1, 2, 3) else None, sup_base)):
            if cp is None or cp in cmap:
                continue
            name = 'uni%04X' % cp
            if i in sup and sup[i]:
                add_glyph(font, name, sup[i], 1, 0, base - sup_base, hmtx[sup[i]][0], cp)
            else:
                w = hmtx[digit[i]][0] * k
                add_glyph(font, name, digit[i], k, (adv - w) / 2, base, adv, cp)
            added.append(chr(cp))
    return added


def build(chars, force=False):
    OUT.mkdir(parents=True, exist_ok=True)
    sig = hashlib.sha1((VERSION + chars + ''.join(f'{f[2]}:{f[2].stat().st_size}' for f in FACES)).encode()).hexdigest()
    stamp = OUT / 'charset.txt'
    manifest = OUT / 'fonts.json'
    if not force and stamp.exists() and manifest.exists() and all((OUT / f[3]).exists() for f in FACES):
        if stamp.read_text('utf8').split('\n', 1)[0] == sig:
            print(f'fonts up to date ({len(chars)} characters)')
            return
    faces = []
    for family, weight, src, out in FACES:
        font = TTFont(src)
        added = add_scripts(font)
        have = font.getBestCmap()
        # U+9FFF only ends a regex range in subtitles.js
        missing = [c for c in chars if ord(c) not in have and not c.isspace() and ord(c) != 0x9FFF]
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.hinting = False
        opts.notdef_outline = True
        opts.name_IDs = [0, 1, 2, 3, 4, 5, 6]
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=[ord(c) for c in chars])
        sub.subset(font)
        font.flavor = 'woff2'
        font.save(OUT / out)
        size = (OUT / out).stat().st_size
        faces.append({'family': family, 'weight': weight, 'file': out})
        print(f'  {out:24s} {size / 1024:7.1f} KB  {len(font.getGlyphOrder())} glyphs'
              + (f'  + {"".join(added)}' if added else '')
              + (f'  (not in font: {"".join(missing)})' if missing else ''))
    manifest.write_text(json.dumps(faces, ensure_ascii=False, indent=1), 'utf8')
    stamp.write_text(sig + '\n' + chars, 'utf8')
    print(f'{len(chars)} characters -> {OUT.relative_to(ROOT)}/')


if __name__ == '__main__':
    build(collect(), force='--force' in sys.argv)
