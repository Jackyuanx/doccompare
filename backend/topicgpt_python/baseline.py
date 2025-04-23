import os
import json
from topicgpt_python.utils import *  # Ensure this import is available

def baseline(api, model, assign_topics_output, prompt_file, output_file, verbose=True):
    # Read the assignment output file (one JSON per line)
    with open(assign_topics_output, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Parse each line as a JSON object
    docs = [json.loads(line) for line in lines]
    
    # Use the first two documents for comparison
    doc1 = docs[0]
    doc2 = docs[1]
    
    # Construct the combined document text including topics
    documents_text = (
        f"Document 1:\nText: {doc1.get('text', '')}\n\n\n"
        f"Document 2:\nText: {doc2.get('text', '')}\n\n\n"
    )
    
    # Read the prompt template (which contains the placeholder {document})
    with open(prompt_file, "r", encoding="utf-8") as pf:
        prompt_template = pf.read()
    
    # Replace the placeholder with the constructed document text
    final_prompt = prompt_template.replace("{document}", documents_text)
    
    if verbose:
        print("Final prompt sent to API Agent:")
        print(final_prompt)
    
    # Initialize the API agent using APIClient with the given API and model
    api_agent = APIClient(api=api, model=model)
    
    # Set parameters for the API call (adjust as needed)
    max_tokens = 1000
    temperature = 0.0
    top_p = 1.0
    
    # Call the API agent to get the comparison text
    generated_text = api_agent.iterative_prompt(final_prompt, max_tokens, temperature, top_p, verbose=verbose)
    
    if verbose:
        print("Generated Comparison:")
        print(generated_text)
    
    # Prepare the output JSON object
    output_data = {"id": 1, "comparison": generated_text}
    
    # Write the output as one JSON object (one line) to the output file
    with open(output_file, "w", encoding="utf-8") as outf:
        outf.write(json.dumps(output_data) + "\n")
    
    if verbose:
        print(f"Comparison output saved to {output_file}")
