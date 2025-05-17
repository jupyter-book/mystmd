---
title: Exposing MyST and Document Metadata
---

When you build websites with MyST, there are two special kinds of metadata that get bundled with your MyST site.
Each is explained below.

## Page document metadata as `.json`

All webpages built with MyST come bundled with a `.json` representation of their content.
This is a machine-readable version of the page that contains all of the metadata and page structure defined by [the MyST specification](xref:spec).

You can access the MyST `.json` representation of a page by adding `.json` to the page name.

For example, the URL of this page is:

```
https://mystmd.org/guide/web-metadata
```

and you can access its JSON representation at the following URL:

```
https://mystmd.org/guide/web-metadata.json
```


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
