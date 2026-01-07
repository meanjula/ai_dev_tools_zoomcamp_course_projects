from fastmcp import FastMCP
import requests
import re
from zipfile import ZipFile
from io import BytesIO
import html2text

mcp = FastMCP("Demo 🚀")

def html_to_text_html2text(html: str) -> str:
    h = html2text.HTML2Text()
    h.ignore_images = True
    h.ignore_links = False
    h.body_width = 0
    return h.handle(html).strip()

def fetch_markdown(url: str) -> str:
    """Fetch markdown content proxied through r.jina.ai for the given URL.

    Raises ValueError for empty `url` and propagates HTTP errors from requests.
    """
    if not url:
        raise ValueError("url is required")
    if not url.startswith("http"):
        url = "https://" + url

    jina_url = f"https://r.jina.ai/{url}"
    resp = requests.get(jina_url, timeout=15)
    resp.raise_for_status()
    text=html_to_text_html2text(resp.text)
    return text

@mcp.tool()
def count_data(url: str) -> int:
    """Count occurrences of the word 'data' in the markdown content.

    This is a plain callable function intended for importing by tests. The MCP
    tool wrapper is registered below so the same logic is exposed as an MCP tool.
    """
    markdown_response = fetch_markdown(url)
  
    data_count = len(list(re.finditer(r'(?={})'.format(re.escape("data")), markdown_response.lower())))
    return data_count

@mcp.tool()
def download_github_data(url):
    """
    Download and extract markdown files from a GitHub repository ZIP archive.
    Only files with .md or .mdx extensions are included in the returned dictionary.
    Keys are the file paths (excluding the top-level directory), and values are the file contents
    """
    response = requests.get(url)
    response.raise_for_status()

    zf = ZipFile(BytesIO(response.content))


    file_dict = {}
    for info in zf.infolist():
        filename = info.filename

        if not filename.split(".")[-1] in ["md", "mdx"]:
            continue
        with zf.open(filename) as file:
            content = file.read().decode("utf-8", errors="ignore")
            updated_file_name = '/'.join(filename.split('/')[1:])
            file_dict[updated_file_name] = content
    return file_dict



if __name__ == "__main__":
  """ mdFiles = download_github_data("https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip")
  print("Markdown Files in the repository:")
  for md in mdFiles:
    print(md) """
mcp.run()