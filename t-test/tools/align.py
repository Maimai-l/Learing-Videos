"""Align the narration script to the recorded voice, character by character.

Usage: python3 tools/align.py materials/旁白.txt build/asr.json build/align.json

Steps:
1. Rewrite each paragraph of the script into the form the TTS actually spoke
   (1.8 -> 一点八, 14.5% -> 百分之十四点五, n -> en ...), remembering which script
   character every spoken syllable came from.
2. Convert both the spoken script and the recognised text to toneless pinyin, so
   that homophone mistakes in recognition (缪/谬, 纽/牛) do not matter.
3. Match the two pinyin sequences, give every matched script character the
   recogniser's timestamp, and interpolate the few unmatched ones.
"""
import difflib
import json
import re
import sys

from pypinyin import lazy_pinyin

DIGITS = "零一二三四五六七八九"
LETTERS = {
    "n": ["en"], "s": ["ai", "si"], "t": ["ti"], "p": ["pi"], "w": ["da", "bu", "liu"],
    "c": ["xi"], "k": ["kai"], "z": ["zei"], "a": ["ei"], "m": ["ai", "mu"], "d": ["di"],
    "e": ["yi"], "x": ["ai", "ke", "si"],
}


def int_reading(n):
    n = int(n)
    if n < 10:
        return DIGITS[n]
    if n < 20:
        return "十" + (DIGITS[n % 10] if n % 10 else "")
    if n < 100:
        return DIGITS[n // 10] + "十" + (DIGITS[n % 10] if n % 10 else "")
    if n < 1000:
        rest = n % 100
        s = DIGITS[n // 100] + "百"
        if rest == 0:
            return s
        if rest < 10:
            return s + "零" + DIGITS[rest]
        return s + (DIGITS[rest // 10] + "十" + (DIGITS[rest % 10] if rest % 10 else ""))
    return "".join(DIGITS[int(d)] for d in str(n))


def number_reading(tok):
    pct = tok.endswith("%")
    t = tok.rstrip("%")
    if "." in t:
        a, b = t.split(".")
        r = int_reading(a) + "点" + "".join(DIGITS[int(d)] for d in b)
    else:
        r = int_reading(t)
    return ("百分之" + r) if pct else r


def spoken_units(text):
    """Return list of (pinyin syllable, script char index) in speaking order."""
    units = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        m = re.match(r"\d+(?:\.\d+)?%?", text[i:])
        if m:
            tok = m.group(0)
            reading = number_reading(tok)
            span = list(range(i, i + len(tok)))
            syl = lazy_pinyin(reading)
            for k, s in enumerate(syl):
                # spread the syllables over the characters of the number
                idx = span[min(len(span) - 1, k * len(span) // max(1, len(syl)))]
                units.append((s, idx))
            i += len(tok)
            continue
        if re.match(r"[㐀-鿿]", ch):
            units.append((lazy_pinyin(ch)[0], i))
        elif ch.lower() in LETTERS:
            for s in LETTERS[ch.lower()]:
                units.append((s, i))
        i += 1
    return units


def asr_units(asr):
    """Flatten recogniser output into (pinyin syllable, start, end) seconds."""
    out = []
    for seg in asr:
        toks = seg["tokens"]
        ts = seg["timestamp"]
        if len(toks) != len(ts):
            # Paraformer emits one timestamp per token; guard against mismatches.
            m = min(len(toks), len(ts))
            toks, ts = toks[:m], ts[:m]
        for tok, (a, b) in zip(toks, ts):
            a, b = a / 1000.0, b / 1000.0
            if re.match(r"^[㐀-鿿]+$", tok):
                syl = lazy_pinyin(tok)
                d = (b - a) / len(syl)
                for k, s in enumerate(syl):
                    out.append((s, a + k * d, a + (k + 1) * d))
            else:
                # English letters / words recognised as Latin text
                for ch in tok.lower():
                    if ch in LETTERS:
                        syl = LETTERS[ch]
                        d = (b - a) / len(syl)
                        for k, s in enumerate(syl):
                            out.append((s, a + k * d, a + (k + 1) * d))
                    elif ch.isdigit():
                        s = lazy_pinyin(DIGITS[int(ch)])[0]
                        out.append((s, a, b))
    return out


def main(txt_path, asr_path, out_path):
    paras = [p.strip() for p in re.split(r"\n\s*\n", open(txt_path, encoding="utf-8").read().strip())]
    asr = json.load(open(asr_path, encoding="utf-8"))
    au = asr_units(asr)
    # script units across all paragraphs
    su = []
    for pi, p in enumerate(paras):
        for s, ci in spoken_units(p):
            su.append((s, pi, ci))
    a_seq = [u[0] for u in su]
    b_seq = [u[0] for u in au]
    sm = difflib.SequenceMatcher(None, a_seq, b_seq, autojunk=False)
    times = [None] * len(su)  # (start, end) per script unit
    matched = 0
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            _, t0, t1 = au[blk.b + k]
            times[blk.a + k] = (t0, t1)
            matched += 1
    # interpolate unmatched units between neighbours
    known = [i for i, t in enumerate(times) if t is not None]
    for i in range(len(times)):
        if times[i] is None:
            left = max([k for k in known if k < i], default=None)
            right = min([k for k in known if k > i], default=None)
            if left is None:
                times[i] = (times[right][0], times[right][0])
            elif right is None:
                times[i] = (times[left][1], times[left][1])
            else:
                a, b = times[left][1], times[right][0]
                f = (i - left) / (right - left)
                t = a + (b - a) * f
                times[i] = (t, t)
    # per paragraph, per character: [start, end] of the first and last unit of that char
    result = []
    for pi, p in enumerate(paras):
        chars = [None] * len(p)
        for (s, ppi, ci), t in zip(su, times):
            if ppi != pi:
                continue
            if chars[ci] is None:
                chars[ci] = [round(t[0], 3), round(t[1], 3)]
            else:
                chars[ci][1] = round(t[1], 3)
        # fill numbers' inner chars (e.g. the '.' of 1.8) from neighbours
        for ci in range(len(p)):
            if chars[ci] is None and not re.match(r"[\s，。、：；？！“”（）,.;:?!]", p[ci]):
                prev = next((chars[k] for k in range(ci - 1, -1, -1) if chars[k]), None)
                nxt = next((chars[k] for k in range(ci + 1, len(p)) if chars[k]), None)
                if prev and nxt:
                    chars[ci] = [prev[1], nxt[0]]
        result.append({"text": p, "chars": chars})
    json.dump({"paragraphs": result, "matched": matched, "units": len(su), "asr_units": len(au)},
              open(out_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"script units {len(su)}, asr units {len(au)}, matched {matched} ({100 * matched / len(su):.1f}%)")
    for pi, p in enumerate(result):
        ts = [c for c in p["chars"] if c]
        print(f"  para {pi + 1:2d}: {ts[0][0]:8.2f} - {ts[-1][1]:8.2f}  {p['text'][:18]}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
