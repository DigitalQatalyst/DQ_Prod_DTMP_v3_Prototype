import os
import re

TARGET_DIR = "e:/dqWork/Support Services/transformation-hub/src/data/digitalIntelligence"

files_to_update = [
    "systemsPortfolio.ts",
    "digitalMaturity.ts",
    "projectsPortfolio.ts"
]

# The examples from the prompt
examples = {
    "system-health-analytics": [
        '"Reduce system downtime with predictive failure alerts before incidents escalate"',
        '"Prioritise infrastructure investment using data-backed health scores across the entire estate"',
        '"Demonstrate platform reliability to executive stakeholders with verifiable uptime metrics"',
        '"Decrease incident response time by surfacing root-cause signals before user impact is felt"'
    ],
    "dbp-maturity-assessment": [
        '"Benchmark your organisation\'s digital capability against public sector and industry peers"',
        '"Identify the specific capability gaps that are blocking transformation progress most acutely"',
        '"Build a credible board-level narrative around maturity progress with before/after comparisons"',
        '"Prioritise investment areas with the highest maturity lift potential relative to cost"'
    ],
    "project-success-prediction": [
        '"Gain real-time visibility into which projects are at risk of delay, overrun, or scope creep"',
        '"Reduce portfolio-level surprises with predictive milestone tracking and trend analysis"',
        '"Ensure resource allocation is aligned to the highest-priority strategic initiatives"',
        '"Improve PMO reporting accuracy by eliminating manual data consolidation across projects"'
    ]
}

def generate_generic_value(title):
    return [
        f'"Enable data-driven decision making for {title.lower()}"',
        '"Identify key risks and opportunities early to optimize outcomes"',
        '"Maximize return on investment through actionable insights"'
    ]

for filename in files_to_update:
    filepath = os.path.join(TARGET_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update interface
    # Find `keyInsights: string[];` and append `businessValue: string[];`
    if 'businessValue: string[];' not in content:
        content = re.sub(
            r"(keyInsights:\s*string\[\];)",
            r"\1\n  businessValue: string[];",
            content
        )

    # 2. Update objects
    # We will find every block that looks like an object in the array and insert businessValue
    # Objects are dictionaries inside the array. We can inject it after keyInsights.
    
    # regex to find keyInsights array and we add businessValue after it
    # We need to know the id of the object to give it the specific example or generic.
    
    # We'll split the file by 'id: "' or "id: '" and process chunks
    chunks = re.split(r'(id:\s*["\'])([^"\']+)(["\'],?)', content)
    
    if len(chunks) > 1:
        new_content = chunks[0]
        for i in range(1, len(chunks), 4):
            prefix = chunks[i]
            obj_id = chunks[i+1]
            suffix = chunks[i+2]
            body = chunks[i+3]
            
            # extract title if possible
            title_match = re.search(r'title:\s*["\']([^"\']+)["\']', body)
            title = title_match.group(1) if title_match else "this service"
            
            # determine businessValue
            b_val = examples.get(obj_id, generate_generic_value(title))
            b_val_str = ",\n      ".join(b_val)
            b_val_array = f'businessValue: [\n      {b_val_str}\n    ]'
            
            # insert after keyInsights: [...]
            # We look for keyInsights: [...], maybe multi-line.
            # A safer way: replace `keyInsights: [([^\]]*)\]` with `keyInsights: [\1],\n    businessValue: [...]`
            
            def replace_keyInsights(m):
                # m.group(0) is the entire keyInsights line(s)
                return m.group(0) + f",\n    {b_val_array}"
            
            # check if businessValue is already there
            if "businessValue:" not in body:
                body = re.sub(r'keyInsights:\s*\[[^\]]*\]', replace_keyInsights, body)
                
            new_content += prefix + obj_id + suffix + body
            
        content = new_content

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {filename}")
