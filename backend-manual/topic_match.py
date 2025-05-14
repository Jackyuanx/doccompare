import os
import json
import openai
import time
from typing import List

# Setup
BASE_DIR = os.path.dirname(__file__)
OUTPUT_PATH = os.path.join(BASE_DIR, "output.json")
RESULT_PATH = os.path.join(BASE_DIR, "topic_matches.json")

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def batch_sentences(sentences: List[str], size: int = 10):
    for i in range(0, len(sentences), size):
        yield sentences[i:i + size]

def ask_batch(topic: str, batch: List[str], batch_idx: int) -> List[str]:
    # Format input
    numbered = "\n".join([f"{i + 1}. {s}" for i, s in enumerate(batch)])
    user_prompt = f"""Topic: "{topic}"

Here is a list of sentences. Return a JSON list of only those that are relevant to the topic.

Sentences:
{numbered}
"""

    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Only return a valid JSON list of the relevant sentences. No explanations."
        },
        {
            "role": "user",
            "content": user_prompt
        }
    ]

    try:
        print(f"🧪 Batch {batch_idx + 1}: Asking GPT about {len(batch)} sentences...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        result = response.choices[0].message.content.strip()
        result = result.replace("```json", "").replace("```", "").strip()
        return json.loads(result)
    except Exception as e:
        print(f"⚠️ GPT error in batch {batch_idx + 1}: {e}")
        return []

def run_topic_match(topic: str, batch_size: int = 10):
    with open(OUTPUT_PATH, encoding="utf-8") as f:
        data = json.load(f)

    sentences = data["sentencesA"] + data["sentencesB"]
    all_relevant = []

    print(f"\n🔍 Topic: '{topic}' — Total sentences: {len(sentences)}")

    for idx, batch in enumerate(batch_sentences(sentences, size=batch_size)):
        relevant = ask_batch(topic, batch, idx)
        all_relevant.extend(relevant)

    with open(RESULT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_relevant, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done. Found {len(all_relevant)} relevant sentences. Saved to {RESULT_PATH}.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python topic_match.py \"Your Topic Here\"")
        exit(1)
    run_topic_match(sys.argv[1], batch_size=50)
