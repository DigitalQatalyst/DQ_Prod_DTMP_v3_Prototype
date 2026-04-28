import os

page_path = "e:/dqWork/Support Services/transformation-hub/src/pages/DigitalIntelligenceDetailPage.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

old_map = """          {[
            "Reduce decision-making time with actionable insights",
            "Identify risks and opportunities before they materialize",
            "Optimize resource allocation and costs",
            "Enable continuous improvement through data-driven insights",
          ].map"""

new_map = """          {(service.businessValue || []).map"""

if old_map in content:
    content = content.replace(old_map, new_map)
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Page updated successfully!")
else:
    print("Could not find the target string in the page. Check for \r\n vs \n.")
    # let's try with \r\n
    old_map_rn = old_map.replace('\n', '\r\n')
    if old_map_rn in content:
        content = content.replace(old_map_rn, new_map.replace('\n', '\r\n'))
        with open(page_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Page updated successfully! (with \\r\\n)")
    else:
        print("Still could not find it.")
