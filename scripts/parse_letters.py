import re
import json
from pathlib import Path
from collections import defaultdict

SRC = Path(__file__).parent.parent / "src/assets/nininshou.txt"
OUT = Path(__file__).parent.parent / "src/assets/nininshou.json"

DATE_RE  = re.compile(r"^(\d+/\d+)")
PAGE_RE = re.compile(r"^(\d+)-(\d+)")

def finalize(page: dict, author: str) -> dict:
    body = page["body"].strip()
    return {
        "envelope":      page["envelope"],
        "page":          page["page"],
        "date":          page["date"],
        "author":        author,
        "pagetype":      "lined" if "lined" in body else "manuscript",
        "stamp":         False,
        "translated_by": "",
        "body":          body,
        **({"paired_with": page["paired_with"]} if "paired_with" in page else {}),
    }

flat_pages = []
current_date = None
current = None
capture_paired = False  # True when the very next non-empty line is a paired_with ref
boy_page = True
switch_to_sensei = False  # defer author switch until after current page is finalized

for line in SRC.read_text(encoding="utf-8").splitlines():
    if "Greetings" in line or "拝啓" in line:
        boy_page = True
        switch_to_sensei = False
    if "Sincerely" in line or "敬具" in line:
        switch_to_sensei = True  # switch AFTER the current page is finalized

    # Capture the line immediately after a 29-N entry as its paired reference
    if capture_paired and line.strip():
        current["paired_with"] = line.strip()
        capture_paired = False
        continue

    if m := DATE_RE.match(line):
        current_date = m.group(1).strip()
        continue

    # Captures the page this page belongs to
    if m := PAGE_RE.match(line):
        env_num = int(m.group(1))
        page_id = f"{m.group(1)}-{m.group(2)}"

        if current:
            flat_pages.append(finalize(current, "boy" if boy_page else "sensei"))
            if switch_to_sensei:
                boy_page = False
                switch_to_sensei = False

        current = {
            "envelope": env_num,
            "page":     page_id,
            "date":     current_date,
            "body":     "",
        }

        if env_num == 29:
            capture_paired = True  # next non-empty line is a paired reference
        continue

    if current:
        current["body"] += line + "\n"

if current:
    flat_pages.append(finalize(current, "boy" if boy_page else "sensei"))

# Group by envelope
grouped = defaultdict(list)
for p in flat_pages:
    grouped[p["envelope"]].append(p)

result = [
    {"envelope": env, "spotify_embed": "", "pages": pages}
    for env, pages in sorted(grouped.items())
]

OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Written {len(result)} envelopes, {len(flat_pages)} pages to {OUT}")
