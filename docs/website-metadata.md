---
title: Exposing MyST and Document Metadata
kernelspec:
  name: python3
  display_name: Python 3
---

When you build websites with MyST, there are two special kinds of metadata that get bundled with your MyST site.
Each is explained below.

:::{note} Executable Examples
This page includes executable Python code examples. When you build the documentation with `myst start --execute`, the code cells will run and display their outputs. See [](./execute-notebooks.md) for more information about executing content in MyST.
:::

## Page document metadata as `.json`

All webpages built with MyST come bundled with a <wiki:JSON> representation of their content.
This is a machine-readable version of the page that contains all of the metadata and page structure defined by [the MyST specification](xref:spec).

You can access the MyST JSON representation of a page by looking up the page's data URL'. For sites with the [`folders`](xref:guide#template-site-myst-book-theme-folders) option enabled, this URL can be found by:
1. Removing any trailing `/`
2. Replacing `/` with `.` in the pathname of the page 
3. Adding a `.json` extension

e.g. <https://foo.com/folder/subfolder/page/> becomes <https://foo.com/folder.subfolder.page.json>.

Meanwhile, for websites without the [`folders`](xref:guide#template-site-myst-book-theme-folders) option, it's as simple as adding `.json` to the end of the URL,m 

For example, the URL of this page is:e.g. <https://foo.com/long-page-name> becomes <https://foo.com/long.page.name.json>.

(myst-xref-json)=

## MyST cross-reference data with `myst.xref.json`

When you create a MyST project on the web, all references in your MyST site are listed in a file that can be referenced by other projects using [](./external-references.md). This allows for programmatic reading of all MyST identifiers in a project (e.g. unique labels and the URL to which each resolves).

This is served in a file called `myst.xref.json` at the website root, and provides a list of reference links in JSON.
For example, the cross-references file for the MyST Guide is at this location:

```
https://mystmd.org/guide/myst.xref.json
```

Below is an example structure of this file:

(myst-xref-json-example)=

```{code-block} json
:filename: myst.xref.json
{
  "version": "1",
  "myst": "1.2.0",
  "references": [
    {
      "kind": "page",
      "data": "/index.json",
      "url": "/"
    },
    {
      "identifier": "xref-features",
      "kind": "heading",
      "data": "/index.json",
      "url": "/",
      "implicit": true
    }
  ]
}
```

The `myst.xref.json` data structure has three entries:

(myst-xref-json-fields)=

version
: The version of the `myst.xref.json` schema

myst
: The version of `mystmd` CLI that created the `myst.xref.json` data

references
: A list of references that are exposed by the project, each object includes:

: identifier

    : The identifier in the project for this reference, this will be unique in the project unless there is an `implicit` flag.
    : This is only optional for pages, which may not have identifiers. All other content must have an identifier.

: html_id

    : The identifier used on the HTML page, which is stricter than the `identifier`.
    : This is only included if it differs from the `identifier`.

: kind

    : The kind of the reference, for example, `page`, `heading`, `figure`, `table`.

: data

    : The location of where to find the content as data. Use this link to find information like the reference's enumerator, title or children.
    : The URL is relative from the location of where the `myst.xref.json` is served from.

: url

    : The location of the HTML page; the URL is relative from the location of where the `myst.xref.json` is served from.
    : For constructing specific links to HTML pages, use `<url>#<html_id || identifier>`.

: implicit

    : A boolean indicating that the reference is implicit to a page. This is common for headings, where the page information must be included.

## How to navigate and scrape MyST sites

The `myst.xref.json` file enables programmatic access to all content in a MyST site. Here are some example workflows with Python.

:::{seealso} This page uses executable examples
These examples use MyST's [executable markdown](./notebooks-with-markdown.md) format with `{code-cell}` directives.
:::

### Get all pages and their URLs

```{code-cell} python
import requests
from IPython.display import JSON

site_url = "https://mystmd.org/guide"
xref_url = f"{site_url}/myst.xref.json"

print(f"Retrieving URL: {xref_url}")
xref_data = requests.get(xref_url).json()

# Filter for pages only
pages = [ref for ref in xref_data["references"] if ref["kind"] == "page"]

# Display the first 10 pages as JSON (de-indexed)
JSON({f"page_{i+1}": page for i, page in enumerate(pages[:10])})
```

### Get all instances of a specific content type

You can filter references by their `kind` to find all figures, tables, citations, or other content types:

```{code-cell} python
from collections import Counter

# Count all content types
all_types = Counter(ref["kind"] for ref in xref_data["references"])

# Show examples of each type
figures = [ref for ref in xref_data["references"] if ref["kind"] == "figure"][:3]
tables = [ref for ref in xref_data["references"] if ref["kind"] == "table"][:3]
internal_refs = [ref for ref in xref_data["references"] if ref.get("implicit")][:3]
external_refs = [ref for ref in xref_data["references"] if ref["kind"] == "heading" and not ref.get("implicit")][:3]

JSON({
    "all_content_types": dict(all_types),
    **{f"figure_{i+1}": fig for i, fig in enumerate(figures)},
    **{f"table_{i+1}": tbl for i, tbl in enumerate(tables)},
    **{f"internal_ref_{i+1}": ref for i, ref in enumerate(internal_refs)},
    **{f"external_ref_{i+1}": ref for i, ref in enumerate(external_refs)}
})
```

### Access page metadata and source information

Each reference includes a `data` field pointing to a JSON file with complete metadata:

```{code-cell} python
# Get first page and fetch its metadata
page = next(ref for ref in xref_data["references"] if ref["kind"] == "page")
data_url = site_url + page["data"]

print(f"Retrieving URL: {data_url}")
page_data = requests.get(data_url).json()

JSON(page_data["frontmatter"])
```

### Download the MyST AST of a page

The JSON file at each page's `data` URL contains the complete MyST Abstract Syntax Tree (AST):

```{code-cell} python
# Get the index page and fetch its AST
index_page = next(ref for ref in xref_data["references"] if ref["url"] == "/")
data_url = site_url + index_page["data"]

print(f"Retrieving URL: {data_url}")
myst_ast = requests.get(data_url).json()

JSON({
    "kind": myst_ast["kind"],
    "slug": myst_ast["slug"],
    "mdast_children_count": len(myst_ast["mdast"]["children"]),
    "mdast_first_child": myst_ast["mdast"]["children"][0]
})
```

### Find and download the exports and source file of a page

You can locate the original source file and available exports for each page using the page's JSON data:

```{code-cell} python
# Get a page with "quickstart" in the URL
example_page = next(ref for ref in xref_data["references"] if "quickstart" in ref["url"])
data_url = site_url + example_page["data"]

print(f"Retrieving URL: {data_url}")
page_data = requests.get(data_url).json()

JSON({
    "page_url": example_page["url"],
    "page_title": page_data["frontmatter"]["title"],
    "source_file": page_data["location"],
    "exports": page_data["frontmatter"]["exports"]
})
```

Download and display the source file content from the CDN:

```{code-cell} python
from IPython.display import Markdown

# Download from CDN and show preview
cdn_url = page_data["frontmatter"]["exports"][0]["url"]

print(f"Retrieving URL: {cdn_url}")
source_content = requests.get(cdn_url).text

preview = '\n\n'.join(source_content.split('\n\n')[:5])
Markdown(f"**Preview of {page_data['location']}:**\n\n{preview}\n\n---\n*... (content continues)*")
```

(cors-settings)=
## Ensure your document is referenceable with CORS

To allow other MyST sites to reference your document, **allow Cross-Origin Resource Sharing (CORS) from all origins** (by setting `Access-Control-Allow-Origin: *`). This is on by default with GitHub Pages, but may not be enabled if you use a different provider (like Netlify).

Enabling all origins in CORS enables your site to:

- Support MyST cross-references (e.g., xref links, see docs) from other sites that use your website as a citation source.
- Enable content embedding, linking, or automated metadata access (e.g., for previews or API consumers) without authentication or same-origin constraints.

For an example of what it looks like to update CORS settings, see [this GitHub PR updating CORS settings for Netlify](https://github.com/the-turing-way/the-turing-way/pull/4156).

### What is CORS and why is it needed?

CORS is a browser security feature that restricts how resources on a web page can be requested from another domain outside the one that served the web page. For example, JavaScript running on external-site.org cannot fetch metadata or assets from https://book.the-turing-way.org/ unless explicitly allowed.

By setting CORS headers to allow all origins (*), you make it possible for external tools and sites to:

- Reference your content directly via structured and stable links.
- Preview or embed sections of your site from another page (with attribution).
- Use it in federated, cross-site knowledge systems (like MyST Markdown references in external books or educational hubs).

If your MyST site is public and does not require authentication, allowing all origins does not pose a security risk.
