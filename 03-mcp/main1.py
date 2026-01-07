import re
import requests



BROWSER_USER_AGENTS = {
    "chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              " (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "firefox": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15"
              " (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    "edge": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
}


def fetch_markdown(url: str) -> str:
    """Fetch page content as Markdown using r.jina.ai.

    The tool accepts a URL (with or without scheme). It prefixes the URL
    with `https://r.jina.ai/` so the service returns a Markdown rendering
    of the page content.
    """
    headers = {
        "User-Agent": "",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    if not url:
        raise ValueError("`url` must be a non-empty string")

    if url.startswith("http://") or url.startswith("https://"):
        target = url
    else:
        target = "http://" + url

    jina_url = f"https://r.jina.ai/{target}"
    print(jina_url)
    resp = requests.get(jina_url, headers=headers, timeout=15)
    resp.raise_for_status()
    text=resp.text
    return text
    



def extract_repo_content(raw_md: str) -> int:
    """
    Extract only the repository content (README, usage, examples) 
    from a full GitHub page Markdown scrape.
    """
    # Step 1: Identify where the "About" or GitHub metadata sections start
    stop_patterns = [
        r'^### Stars',          # stars
        r'^### Watchers',       # watchers
        r'^### Forks',          # forks
        r'^About',              # About section
        r'^Languages',          # languages
        r'^Footer',             # footer
    ]
    
    # Combine patterns into one regex
    stop_regex = re.compile('|'.join(stop_patterns), re.MULTILINE)
    
    # Find the first match position
    match = stop_regex.search(raw_md)
    if match:
        cleaned = raw_md[:match.start()]
    else:
        cleaned = raw_md  # keep everything if no match
    
    # Optional: remove multiple blank lines
    cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned)
    
    return cleaned.strip()

if __name__ == "__main__":
    """ url = input("Enter a URL to fetch as Markdown: ") """
    url="https://datatalks.club/"
    data = fetch_markdown(url)
    data_count = len(list(re.finditer(r'(?={})'.format(re.escape("data")), data.lower())))  
    print(f"Occurrences of 'data': {data_count}")

"""     print(len(data))
    clean_md = extract_repo_content(data)
    print(f"Length of cleaned markdown: {len(clean_md)} characters") """
    
       # Word count
"""     words = data.split()
    word_count = len(words)
    data_count = len(re.findall(r"\bdata\b", data.lower()))
    print(f"Word count: {word_count}")
    print(f"Occurrences of 'data': {data_count}") """
    
    