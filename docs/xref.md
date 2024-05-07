---
title: Exposing Project Information
---

(myst-xref-json)=

## `myst.xref.json`

When you create a MyST project, the references that you make can be automatically linked and exposed to be referenced by other projects using [](./external-references.md). This must be served at `myst.xref.json` at the project root, and provides a list of reference links in JSON.

(myst-xref-json-example)=

```json
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
