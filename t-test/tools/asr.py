"""Run Chinese speech recognition with per-character timestamps on the narration.

Usage: python3 tools/asr.py build/audio/voice16k.wav build/asr.json

The result is cached; align.py turns it into per-character times for the script.
"""
import json
import sys

from funasr import AutoModel


def main(wav, out):
    model = AutoModel(model="paraformer-zh", vad_model="fsmn-vad", disable_update=True)
    res = model.generate(input=wav, batch_size_s=120, sentence_timestamp=False)
    items = []
    for r in res:
        text = r.get("text", "")
        ts = r.get("timestamp", [])
        tokens = text.split()
        items.append({"text": text, "tokens": tokens, "timestamp": ts})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False)
    n = sum(len(i["tokens"]) for i in items)
    print("segments", len(items), "tokens", n, "timestamps", sum(len(i["timestamp"]) for i in items))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
