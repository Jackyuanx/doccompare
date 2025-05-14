import json
import re
import os
import openai

BASE_DIR = os.path.dirname(__file__)
DOC_A_PATH = os.path.join(BASE_DIR, "../public/docA.txt")
DOC_B_PATH = os.path.join(BASE_DIR, "../public/docB.txt")

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def smart_sentence_split(text):
    text = re.sub(r'\.{4,}', '.', text)
    text = re.sub(r'(?<=\d)\.(?=\d)', '§', text)
    protected_abbr = ['e.g.', 'i.e.', 'Mr.', 'Dr.', 'vs.', 'etc.']
    for abbr in protected_abbr:
        text = text.replace(abbr, abbr.replace('.', '§'))
    raw_sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9“"\'])', text)
    return [s.replace('§', '.').strip() for s in raw_sentences if s.strip()]

def extract_topics(text):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an assistant that suggests high-level candidate topics based on a given text. "
                           "Keep the list short, general, and focused on potential thematic areas of discussion or policy interest. "
                           "Return a JSON list of strings, like: [\"topic1\", \"topic2\"]"
            },
            {"role": "user", "content": f"Suggest topics from this text:\n\n{text}"}
        ]
    )
    result = response.choices[0].message.content.strip()
    return json.loads(result.replace("```json", "").replace("```", "").strip())

def merge_topics(a_topics, b_topics):
    system_msg = (
        "You are an assistant that merges two lists of candidate topics. "
        "Your task is to return a refined list that removes duplicates or overly similar entries, "
        "merges overlapping ideas, and improves the clarity and quality of topic names. "
        "Additionally remove any country specific labels and replace with more general topics. "
        "Return a clean JSON list of strings only."
    )
    user_msg = f"List A:\n{a_topics}\n\nList B:\n{b_topics}\n\nPlease merge and improve these lists."
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ]
    )
    result = response.choices[0].message.content.strip()
    return json.loads(result.replace("```json", "").replace("```", "").strip())

def run_pipeline():
    with open(DOC_A_PATH, encoding="utf-8") as f:
        docA = f.read()
    with open(DOC_B_PATH, encoding="utf-8") as f:
        docB = f.read()

    a_topics = extract_topics(docA)
    b_topics = extract_topics(docB)
    merged = merge_topics(a_topics, b_topics)

    sentA = smart_sentence_split(docA)
    sentB = smart_sentence_split(docB)

    output = {
        "sentencesA": sentA,
        "sentencesB": sentB,
        "topics": merged
    }

    output_path = os.path.join(BASE_DIR, "output.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(sentA)} + {len(sentB)} sentences and {len(merged)} topics to output.json")

if __name__ == "__main__":
    run_pipeline()
