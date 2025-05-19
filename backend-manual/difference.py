import os
import json

BASE_DIR = os.path.dirname(__file__)
OUTPUT_PATH = os.path.join(BASE_DIR, "output.json")
MATCHES_PATH = os.path.join(BASE_DIR, "topic_matches.json")
DIFF_PATH = os.path.join(BASE_DIR, "difference.json")

def run_difference():
    with open(OUTPUT_PATH, encoding="utf-8") as f:
        full = json.load(f)
    with open(MATCHES_PATH, encoding="utf-8") as f:
        relevant = set(json.load(f))

    all_sentences = full["sentencesA"] + full["sentencesB"]
    difference = [s for s in all_sentences if s not in relevant]

    with open(DIFF_PATH, "w", encoding="utf-8") as f:
        json.dump(difference, f, ensure_ascii=False, indent=2)

    print(f"✅ Wrote {len(difference)} non-relevant sentences to difference.json")

if __name__ == "__main__":
    run_difference()
