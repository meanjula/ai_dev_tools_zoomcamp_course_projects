# MCP: web word-counter

Small MCP (Minimal Chat/CLI/Controller) project that provides a simple tool to
count occurrences of a word on a web page. The repository includes a FastMCP
tool `count_data` that fetches a page via `https://r.jina.ai/` and returns the
count of the word "data" (several counting modes supported in examples).

**Contents**
- `main.py` — MCP tool using `fastmcp` and `httpx` to fetch and count words.
- `copilot_count.py`, `count/` — helper scripts and experiments.

## Install

Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If you don't have `requirements.txt`, install:

```bash
pip install fastmcp httpx
```

## Run the MCP tool locally

Start the MCP server (same command you use locally):

```bash
# run the MCP tool server
python main.py
```

Then call the tool (example using `curl` or your MCP client). The `count_data`
tool returns the number of occurrences of the word "data" found in the
markdown-rendered homepage (case-insensitive whole-word by default).

## Useful counting examples (Python)

This project counts words using regex whole-word matching. For substring
occurrences (including overlaps), use this helper:

```python
import re

def count_substring(text: str, sub: str, case_sensitive: bool = False, overlapping: bool = True) -> int:
		if not case_sensitive:
				text = text.lower()
				sub = sub.lower()
		if not sub:
				return 0
		if overlapping:
				return len(list(re.finditer(r'(?={})'.format(re.escape(sub)), text)))
		else:
				return text.count(sub)

# Examples
text = "Data datadata database"
print(count_substring(text, "data"))             # -> 4 (case-insensitive, overlapping)
print(count_substring(text, "data", overlapping=False))  # -> 3 (non-overlapping)
```

## Notes
- The MCP data-counter used in this project can be configured to count
	whole-words (default) or substrings. If you need counts restricted to
	visible text only (HTML-stripped), run an HTML-to-text extraction step first.
- If you change `main.py`, restart the MCP server: stop the running process
	(Ctrl+C) and re-run `python main.py`.

## License
Project is provided as-is. Add a license if desired.
