import os
import json
import openai

BASE_DIR = os.path.dirname(__file__)
MATCHES_PATH = os.path.join(BASE_DIR, "topic_matches.json")
DIFF_PATH = os.path.join(BASE_DIR, "difference.json")
OUT_PATH = os.path.join(BASE_DIR, "discussion.json")

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_discussion(topic: str):
    # Load previously saved relevant and difference sentences
    with open(MATCHES_PATH, encoding="utf-8") as f:
        matches = json.load(f)

    with open(DIFF_PATH, encoding="utf-8") as f:
        differences = json.load(f)

    # Construct GPT prompt
    prompt = f"""
You are a policy analyst comparing two documents based on the topic: "{topic}".

You are given two sets of sentences:
- "Relevant" — sentences both documents emphasize about the topic.
- "Difference" — sentences that were not tagged as relevant (they may represent divergence in focus, omissions, or unrelated content).

Based on these, write a clear, structured comparison that:
1. Summarizes what both documents emphasize based on the sets of sentences.
2. Explains key differences, omissions, or unique emphasis in each, use examples from the sets.

Relevant Sentences:
{json.dumps(matches, indent=2)}

Different/Not Emphasized:
{json.dumps(differences, indent=2)}
"""

    # Call GPT
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You write fluent document comparisons based on topic-focused evidence."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    discussion_text = response.choices[0].message.content.strip()

    # Save to discussion.json
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"text": discussion_text}, f, ensure_ascii=False, indent=2)

    print("✅ Comparison generated and saved to discussion.json")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python generate_discussion.py \"Your Topic Here\"")
        exit(1)

    run_discussion(sys.argv[1])