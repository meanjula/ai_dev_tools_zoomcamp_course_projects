# 03-MCP Project

## Overview
This project is a **Model Context Protocol (MCP) server** that provides tools for fetching and analyzing web content. It uses FastMCP to expose utilities for counting specific keywords and downloading GitHub repository files.

## Features

- **`count_data(url)`** - Counts occurrences of the word "data" in webpage content
  - Fetches content via r.jina.ai (converts HTML to Markdown)
  - Handles URLs with or without HTTP/HTTPS scheme
  - Case-insensitive matching

- **`download_github_data(url)`** - Downloads and extracts Markdown files from GitHub repositories
  - Accepts GitHub ZIP archive URLs
  - Filters for `.md` and `.mdx` files only
  - Returns a dictionary with file paths as keys and content as values

## Setup

### Prerequisites
- Python 3.12+
- `uv` package manager

### Installation

Add required packages:
```bash
uv add fastmcp requests
```

Or install all dependencies:
```bash
uv sync
```

## Project Structure

```
.
├── main.py                 # FastMCP server implementation
├── test.py                 # Unit tests for count_data()
├── webScrapWithJina.py     # Additional web scraping utilities
├── test.ipynb              # Jupyter notebook with examples
├── pyproject.toml          # Project dependencies
└── .vscode/mcp.json        # MCP server configuration
```

## Running the Server

Start the MCP server:
```bash
uv run main.py
```

The server will be available for clients to connect to via the configuration in `.vscode/mcp.json`.

## Testing

Run the test suite:
```bash
pytest test.py
```

Tests include:
- URL scheme handling (with/without http://)
- Case-insensitive word counting
- Overlapping matches
- HTTP error handling