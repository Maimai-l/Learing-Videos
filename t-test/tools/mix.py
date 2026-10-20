"""Assemble the final soundtrack: narration placed on the video timeline + looped BGM.

Usage: python3 tools/mix.py build/timeline.json build/audio/voice_over_ttest.wav build/audio/BGM.wav build/audio/mix

Writes <out>.wav (48 kHz stereo) and <out>.m4a (AAC).
- The narration is cut between paragraphs and shifted exactly as build-timeline.mjs
  decided (title card, chapter pauses), so the picture and the voice stay in sync.
- The BGM loops with crossfades at quiet passages, sits well below the voice while
  someone is speaking, rises a little in pauses, and fades out at the end.
"""
import json
import subprocess
import sys

import numpy as np

SR = 48000


def load(path, ch):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).copy()


def fade(n, kind="in"):
    x = np.linspace(0, 1, n, dtype=np.float32)
    w = np.sin(0.5 * np.pi * x) ** 2
    return w if kind == "in" else w[::-1]


def smooth(env, seconds):
    n = max(3, int(seconds * SR / 100))  # envelope is at 100 Hz
    k = np.hanning(n)
    k /= k.sum()
    pad = np.pad(env, (n, n), mode="edge")
    return np.convolve(pad, k, mode="same")[n:-n]


def main(tl_path, voice_path, bgm_path, out):
    tl = json.load(open(tl_path, encoding="utf-8"))
    total = tl["total"]
    N = int(round(total * SR))
    voice = load(voice_path, 1)[:, 0]
    bgm = load(bgm_path, 2)

    # ---- narration on the timeline ----
    vt = np.zeros(N, dtype=np.float32)
    v0 = tl["voice"]["v0"]
    vEnd = tl["voice"]["vEnd"]
    cuts = tl["voice"]["cuts"]
    bounds = [v0] + [c["v"] for c in cuts] + [vEnd]
    shift = tl["voice"]["shift0"]
    for k in range(len(bounds) - 1):
        if k > 0:
            shift += cuts[k - 1]["pause"]
        a, b = bounds[k], bounds[k + 1]
        ia, ib = int(round(a * SR)), min(len(voice), int(round(b * SR)))
        seg = voice[ia:ib].copy()
        f = min(len(seg) // 4, int(0.012 * SR))  # tiny fades: the cuts are in silence anyway
        if f > 0:
            seg[:f] *= fade(f, "in")
            seg[-f:] *= fade(f, "out")
        ga = int(round((a + shift) * SR))
        vt[ga:ga + len(seg)] += seg[: max(0, min(len(seg), N - ga))]
    voice_st = np.stack([vt, vt], axis=1)

    # ---- BGM: loop the body with crossfades, end with the original fade-out ----
    body_a, body_b, xf = 2.0, 102.5, 3.0
    body = bgm[int(body_a * SR):int(body_b * SR)]
    tail = bgm[int(body_b * SR) - int(xf * SR):]  # the real ending (fades out on its own)
    X = int(xf * SR)
    track = np.zeros((N + len(body), 2), dtype=np.float32)
    pos = 0
    # leave room so the original ending lands at the very end of the video
    end_start = N - len(tail)
    first = True
    while pos < end_start:
        # the first pass keeps the music's own opening; later passes start at body_a
        seg = bgm[: int(body_b * SR)].copy() if first else body.copy()
        if not first:
            seg[:X] *= fade(X, "in")[:, None]
        seg[-X:] *= fade(X, "out")[:, None]
        track[pos:pos + len(seg)] += seg
        pos += len(seg) - X
        first = False
    # ending: crossfade into the original tail at end_start
    tl_seg = tail.copy()
    tl_seg[:X] *= fade(X, "in")[:, None]
    # cut whatever the loops put after end_start + X, fading it out
    track[end_start:end_start + X] *= fade(X, "out")[:, None]
    track[end_start + X:] = 0
    track[end_start:end_start + len(tl_seg)] += tl_seg
    track = track[:N]

    # ---- BGM level: duck under speech ----
    fps_env = 100
    M = int(total * fps_env) + 1
    env = np.full(M, -5.0)  # pauses
    speech = []
    for p in tl["paragraphs"]:
        speech.append((p["g0"] - 0.3, p["g1"] + 0.35))
    for a, b in speech:
        env[int(a * fps_env):int(b * fps_env)] = -9.5
    first_speech = speech[0][0]
    last_speech = speech[-1][1]
    env[: int((first_speech - 0.6) * fps_env)] = 0.0  # title card
    env[int((last_speech + 0.4) * fps_env):] = -1.5  # closing
    # short gaps (< 1.4 s) stay ducked
    for (a1, b1), (a2, b2) in zip(speech, speech[1:]):
        if a2 - b1 < 1.4:
            env[int(b1 * fps_env):int(a2 * fps_env)] = -9.5
    env = smooth(env, 0.9)
    # final fade-out over the last 4 s
    t_env = np.arange(M) / fps_env
    out_f = np.clip((total - t_env) / 4.0, 0, 1)
    gain = 10 ** (env / 20) * np.sin(0.5 * np.pi * out_f) ** 2
    # fade in from silence over the first second
    gain *= np.clip(t_env / 1.0, 0, 1)
    g = np.interp(np.arange(N) / SR, t_env, gain).astype(np.float32)
    mix = voice_st + track * g[:, None]

    # ---- loudness: measure with ffmpeg, normalise to -16 LUFS ----
    tmp = out + ".tmp.wav"
    write_wav(tmp, mix)
    I = measure_lufs(tmp)
    mix *= 10 ** ((-16.0 - I) / 20)
    peak = np.abs(mix).max()
    if peak > 0.89:  # about -1 dBFS sample peak
        mix *= 0.89 / peak
    write_wav(out + ".wav", mix)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out + ".wav", "-c:a", "aac", "-b:a", "192k", out + ".m4a"], check=True)
    subprocess.run(["rm", "-f", tmp])
    print(f"mix: {total:.2f} s, loudness before {I:.1f} LUFS -> -16, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")


def write_wav(path, x):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", path],
                         stdin=subprocess.PIPE)
    p.stdin.write(np.ascontiguousarray(x, dtype=np.float32).tobytes())
    p.stdin.close()
    p.wait()


def measure_lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True)
    lines = [l for l in r.stderr.splitlines() if l.strip().startswith("I:")]
    return float(lines[-1].split()[1])


if __name__ == "__main__":
    main(*sys.argv[1:5])
