#!/usr/bin/env python3
"""
Run TopicGPT on all sentences from docA.txt + docB.txt
and print the paths of the generation / assignment JSON files.
"""
import json, os, io, contextlib
from pathlib import Path
import os
api_key = os.environ["OPENAI_API_KEY"]
# Add the folder to sys.path

# Import modules directly
from topicgpt_python.data_sample import sample_data
from topicgpt_python.generation_1 import generate_topic_lvl1
from topicgpt_python.generation_2 import generate_topic_lvl2
from topicgpt_python.refinement import refine_topics
from topicgpt_python.assignment import assign_topics
from topicgpt_python.correction import correct_topics
from topicgpt_python.comparison import comparison
from topicgpt_python.baseline import baseline
from topicgpt_python.evaluate import evaluate
import yaml

with open("backend/config.yml", "r") as f:
    config = yaml.safe_load(f)

# ----------------------------------------------------------------------
DOC_DIR = Path("public")                 # served files like docA.txt
DATA_DIR = Path("backend/data")         # stores TopicGPT inputs/outputs
IN_DIR = DATA_DIR / "input"
OUT_DIR = DATA_DIR / "output"

# Create folders if missing
IN_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)
import re
from typing import List

_SENT_SPLIT = re.compile(r'(?<=[.!?])\s+')

def split_sentences(text: str) -> List[str]:
    """
    • Replace all runs of whitespace (newline, tab, double-space) with a single space.
    • Split where the previous char is . ! or ?  followed by whitespace.
    • Strip trailing/leading spaces on each sentence.
    """
    clean = re.sub(r'\s+', ' ', text.strip())        # collapse newlines etc.
    return [s.strip() for s in _SENT_SPLIT.split(clean) if s.strip()]

def read_docs():
    """Read docA and docB text files from the public folder."""
    doc_a = (DOC_DIR / "docA.txt").read_text(encoding="utf-8")
    doc_b = (DOC_DIR / "docB.txt").read_text(encoding="utf-8")
    return doc_a, doc_b

a, b = read_docs()
sentences = split_sentences(a) + split_sentences(b)

with open(IN_DIR / "sentences.jsonl", "w") as f:
    for i, s in enumerate(sentences):
        json.dump({"id": i, "text": s}, f)
        f.write("\n")



def run_topicgpt():


    generate_topic_lvl1(
        "openai",
        "gpt-4o",
        config["data_sample"],
        config["generation"]["prompt"],
        config["generation"]["seed"],
        config["generation"]["output"],
        config["generation"]["topic_output"],
        verbose=config["verbose"],
    )

    # if config["generate_subtopics"]:
    #     generate_topic_lvl2(
    #         "openai",
    #         "gpt-4o",
    #         config["generation"]["topic_output"],
    #         config["generation"]["output"],
    #         config["generation_2"]["prompt"],
    #         config["generation_2"]["output"],
    #         config["generation_2"]["topic_output"],
    #         verbose=config["verbose"],
    #     )

    # if config["refining_topics"]:
    #     refine_topics(
    #     "openai",
    #     "gpt-4o",
    #     config["refinement"]["prompt"],
    #     config["generation"]["output"],
    #     config["generation"]["topic_output"],
    #     config["refinement"]["topic_output"],
    #     config["refinement"]["output"],
    #     verbose=config["verbose"],
    #     remove=config["refinement"]["remove"],
    #     mapping_file=config["refinement"]["mapping_file"]
    # )


    # assign_topics(
    #     "openai",
    #     "gpt-4o-mini",
    #     config["data_sample"],
    #     config["assignment"]["prompt"],
    #     config["assignment"]["output"],
    #     config['generation']['topic_output'],  # TODO: change to generation_2 if you have subtopics, or config['refinement']['topic_output'] if you refined topics
    #     verbose=config["verbose"],
    # )

    # correct_topics(
    # "openai",
    # "gpt-4o-mini",
    # config["assignment"]["output"],
    # config["correction"]["prompt"],
    # config['refinement']['topic_output'],  # TODO: change to generation_2 if you have subtopics, or config['refinement']['topic_output'] if you refined topics
    # config["correction"]["output"],
    # verbose=config["verbose"],
    # )
    return {"assignments": str(config["assignment"]["output"])}

if __name__ == "__main__":
    with contextlib.redirect_stdout(io.StringIO()):
        run_topicgpt()
    with open("backend/out/generation1output.jsonl", "r", encoding="utf-8") as f:
        content = [json.loads(line) for line in f if line.strip()]
        print(json.dumps(content))