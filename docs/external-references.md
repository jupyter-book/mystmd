---
title: External References
description: External references dynamically include content into your MyST Markdown projects, from Wikipedia, intersphinx, DOIs, RRIDs, and any other MyST projects. Allowing your documents to be rich, interactive and automatically kept up to date.
thumbnail: ./thumbnails/external-references.png
---

MyST Markdown allows you to connect your <wiki:documents> to external [linked](wiki:Hyperlink) content like <wiki:Wikipedia>, which allow for [hover](wiki:Hovercraft)-references with external content.
External references are references to structured content or documents that are outside of your project.
MyST supports referencing rich content in a growing number of formats, including:

1. other `mystmd` projects, with rich cross-linking of content
1. integrating directly with **Wikipedia** articles to show tooltips,
1. linking to other **Sphinx** documentation using intersphinx,
1. link to files on **GitHub** and show inline previews,
1. showing structured content from scholarly sources like **DOIs** or **RRIDs**.

```{seealso}
[](./cross-references.md) for referencing content in your project and [](./citations.md) to cite scholarly work and create bibliographies.
```

(myst-xref)=

## External MyST projects

When using the HTML renderer for MyST, an API is provided for the deployed site.
This provides pre-parsed, structured content as an AST that can be included in other projects and rendered in a tooltip.

:::{tip} Add `.json` to any MyST URL to access the structured data
All MyST pages come with a structured data representation that provides authors, license information,
as well as the full content in a parsed form that can be used for an inline reference on external pages.
Try adding `.json` at the end of the URL on this page.
:::

In your project configuration, include the `references` object with named links out to the external MyST projects that you will reference in your project. The example below shows how you would load cross-references that are pulled from the MyST Specification documentation.

```{code-block} yaml
:label: myst-xref-config
:filename: myst.yml
:caption: Add `references` to your project configuration in your `myst.yml`, MyST will then provide access to all of content on those pages in links and embeds.
project:
  references:
    spec: https://mystmd.org/spec
```

When you specify these in your project configuration, MyST will load the cross-references and provide access to all of the pages and reference targets in that project.
References are cached to disk locally in the `_build` folder, eliminating duplicate web requests on subsequent builds.
To delete the cache and manually re-load the references, run `myst clean --cache`.

````{important}
# MyST Cross Reference Examples

```{list-table}
:label: tbl:syntax-xref
:header-rows: 1
* - MyST Syntax
  - Rendered
* - `[](xref:spec)`
    : A reference to the first page of the MyST Spec.
  - [](xref:spec)
* - `[](xref:spec#paragraph)`
    : A reference to the node "paragraph" target in the MyST Spec.
  - [](xref:spec#paragraph)
* - `<xref:spec/tables#example>`
    : Alternate link syntax that references a heading on a specific page of the spec documentation.
  - <xref:spec/tables#example>
```
````

To reference content in the linked MyST project, use the `xref:` protocol in a link followed by the `project` key (from `references`), the url path and the target.
For example, `<xref:spec/tables#example>` renders to:\
"<xref:spec/tables#example>"\
and is made of a `protocol`, `project`, `path` and `target`.

protocol
: The protocol for this type of link is `xref:`, and is what selects for cross-project referencing.

project
: the `project` key above is "spec" which is defined in your local [project configuration](#myst-xref-config) above.

path
: the `path` is everything that follows the project before the `#`. It corresponds directly to the URL path in the MyST site. In the example above, path is `/tables`.
: Path is **optional** in most cases; the `target` can be resolved against the entire project without the path. An exception to this is headings without an explicit label in the source markdown — these will require path. Note that these references may not be intended to be persistent by the source author, so use caution in linking to them!

target
: The target is everything that follows the `#` and is a named reference in the project. In the example above it is "syntax".
: Target is also optional - if not provided, the cross reference will simply link to a page in the external MyST project. However, without the target, there will not be a rendered tooltip.
: When creating a cross reference, you can determine `path` and `target` by simply navigating to your target content in the external MyST project and copying the path and fragment from the URL.

If no link text is provided, e.g. `[](xref:...)`, text will be generated from the external project at build-time. You may override this behavior by providing you own text, `[text](xref:...)`.

:::{tip} References are stored in a [`myst.xref.json`](#myst-xref-json) file
:class: dropdown
All MyST sites published to the web expose a [`myst.xref.json`](#myst-xref-json) file that contains all of the cross-references information about a MyST site.
This file is what MyST pulls when you point to an external MyST site for cross-referencing.
It is also a machine-readable record that can be used for analyzing the cross-referencing behavior of MyST projects.
:::

(intersphinx)=

## Sphinx documentation

MyST can integrate directly with other Sphinx documentation, which is used in many Python projects including the [standard library](https://docs.python.org/).
This re-uses the reference specification defined by [the intersphinx plugin for Sphinx](https://www.sphinx-doc.org/en/master/usage/extensions/intersphinx.html).

Similar to [MyST cross references](#myst-xref), use the `references` object to list Sphinx projects. For example, in the demonstration below we will load the Python 3.7 documentation and Jupyter Book docs, both of which use sphinx and expose cross references through an `objects.inv` file.

(intersphinx-config)=

```yaml
references:
  python: https://docs.python.org/3.7/
  jupyterbook: https://jupyterbook.org/en/stable/
```

```{tip}
In your `references` object, you may freely mix MyST and Sphinx projects. MyST will decipher which to use, based on the presence of `myst.xref.json` or `objects.inv` files at the specified URL.
```

The behavior of these entries is identical to MyST cross references: the remote `objects.inv` file, which contains all available project references, is downloaded and cached in the `_build` folder.

````{important}
# Sphinx Examples

```{list-table}
:header-rows: 1
* - MyST Syntax
  - Rendered
* - `[](xref:python#zipapp-specifying-the-interpreter)`
    : A reference to the reference documentation in Python.
  - [](xref:python#zipapp-specifying-the-interpreter)
* - `[](xref:jupyterbook#content:references)`
    : A reference to the Jupyter Book documentation, that brings you directly to the reference,
      as well as fills in the label text.
  - [](xref:jupyterbook#content:references)
```
````

To reference a function, class or label in the linked documentation, use the `xref:` protocol in a link followed by the `project` key and the target.
For example, `<xref:python#library/abc>` renders to:\
"<xref:python#library/abc>"\
and is made of a `protocol`, `project` and `target`.

protocol
: The protocol for this type of link is `xref:`, and is what selects for cross-project referencing.

project
: the `project` key above is "python" which is defined in your local [project configuration](#intersphinx-config) above.

target
: The target is everything that follows the `#` and is a named reference in the project.
: In the example above it is "library/abc".

As with any link, the text can be overridden using markdown link syntax `[text](xref:...)`.

````{tip}
:class: dropdown
# How to find the Sphinx target?

The HTML IDs that are part of the documentation are not always the targets that are used in the documentation. The easiest way to find the target to use is to look at the source documentation in RST or MyST.

Look for the `(target)=` syntax or `:label:` on a directive.

MyST will warn you in the console if your target is not found.

You can also use the [intersphinx](https://www.npmjs.com/package/intersphinx) package, for example, `list`, or `parse` an intersphinx inventory:

```bash
>> intersphinx list https://docs.python.org/3.7 --domain std:doc --includes abc --limit 5

std:doc Abstract Base Classes (library/abc)
  https://docs.python.org/3.7/library/abc.html
std:doc Abstract Base Classes for Containers (library/collections.abc)
  https://docs.python.org/3.7/library/collections.abc.html
```

Use the target in the parenthesis, which would be `xref:python#library/abc` above.
````

## Wikipedia Links

MyST Markdown can directly integrate with <wiki:Wikipedia> to create hover-card information directly integrated into your myst documents. The syntax follows standard markdown links, under the `wiki:` protocol followed by the page title[^1]. As with any other link, you can either follow a `[text](wiki:Page_Title)` or `<wiki:Page_Title>`, which if no text is provided for the links will be replaced with the page title.

[^1]: Replace any spaces in the page title with underscores.

```{myst}
Primordial <wiki:gravitational_waves> are hypothesized to arise from <wiki:cosmic_inflation>, a faster-than-light expansion just after the <wiki:big_bang>.
```

The links will take you to Wikipedia, as well as provide a tooltip and description directly on the page.

To show different text you can use a similar technique to references:\
`[my **bold** text](wiki:reference)`

```{myst}
* [big bang](wiki:The_Big_Bang_Theory)
* [](wiki:big_bang)
```

```{tip}
:class: dropdown
# Finding and formatting the page title
To find the page title, browse Wikipedia and copy the last part of the URL, for example:\
`Page_Title` in `https://wikipedia.org/wiki/Page_Title`. If you do not supply text for the link specifically, then the case of the link will be preserved and shown without the underscores.

Usually the page titles resolve properly, so just try guessing when you are writing and then you can check them with the live hover preview.

Note that if the page title has spaces in it, simply replace them with underscores.
```

```{important}
:class: dropdown
# Different languages or wikis

There are many different official and unofficial wikis that use the same [Wikimedia](wiki:Wikimedia_Foundation) technology, including subdomains in various languages.

Wikipedia links, like `https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)` will work fine out of the box, and point to [](https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)) with the popup still working!

% TODO: Allow the ability to set the default language to use on your MyST site. This is already possible in the transformers.

% TODO: Set the default wiki links, or an additional wiki link in references, e.g. to something like https://wiki.seg.org/wiki/Knowledge_tree
```

## GitHub

### Issues and Pull Requests

MyST Markdown can directly link and show preview of GitHub issues and Pull Requests, for example, [#336](https://github.com/jupyter-book/mystmd/issues/336) and [#87](https://github.com/jupyter-book/myst-theme/pull/87). To enable this, just use a normal link to your

```markdown
[#87](https://github.com/jupyter-book/myst-theme/pull/87)
```

If you do not include children for the link, then the default text will become `owner/repo#123`.

### Linking to Code

MyST Markdown can directly integrate with links to GitHub to create hover-card information directly integrated into your MyST documents. For example, a link to the [linkTransforms](https://github.com/jupyter-book/mystmd/blob/78d16ee1a/packages/myst-transforms/src/links/plugin.ts#L12-L28) plugin code shows a preview of the code. The code preview works for both multiple line numbers and highlighting [single lines](https://github.com/jupyter-book/mystmd/blob/78d16ee1a/packages/myst-transforms/src/links/plugin.ts#L30), which shows the surrounding ten lines, with the referenced line highlighted. If you reference the [full file](https://github.com/jupyter-book/mystmd/blob/78d16ee1a/packages/myst-transforms/src/links/plugin.ts) then the first ten lines of the file are shown in the preview.

````{important}
:class: dropdown
# Creating GitHub links to code
GitHub links to code can be generated on the GitHub web application when browsing code and click on the line numbers, then copy the URL. To select multiple lines, click your first line then shift-click to select multiple lines, the URL will be updated to end with `#L4-L6`. The structure of the link should look like:

```text
https://github.com/{{org}}/{{repo}}/blob/{{reference}}/file.py#L4-L6
```

Any git `reference` will work, however, picking a branch like `main` may mean that your code line numbers will change, instead, you may want to go to navigate to a specific git commit or tag, which will show up in the URL.
````

% TODO: Add ability to reference issues and PRs with queries for the issue names, and PR information.

## Linking DOIs

It is possible to include DOIs as external content, and they are also added as citations to your project and show up in the references section at the bottom of a document. See [](./citations.md) for more details, specifically [](#doi-links), which explains linking DOIs with the `<doi:10.5281/zenodo.6476040>` or `[](doi:10.5281/zenodo.6476040)` to create a citation, for example (<doi:10.5281/zenodo.6476040>).

## Research Resource Identifiers

{abbr}`RRID (Research Resource Identifiers)`s are persistent, unique identifiers for referencing a research resource, such as an antibody, plasmid, organism, or scientific tool. These are helpful for ensuring reproducibility and exact communication in scientific studies. See the [RRID website](https://scicrunch.org/resources) for more information.

MyST Markdown allows you to directly integrate with the RRID database to pull information and validate the links are correct as you are writing documents. The metadata is passed to subsequent systems (e.g. PDF documents, compatible journals and preprint servers) and helps keep your science reproducible.

To create an RRID link, use the `rrid:` protocol followed by the resource identifier, for example:

- `[](rrid:SCR_008394)` becomes [](rrid:SCR_008394)
- `<rrid:SCR_008394>` becomes <rrid:SCR_008394>

````{note}
# Example Methods Section

An edited excerpt from _Impaired speed encoding and grid cell periodicity in a mouse model of tauopathy_
{cite:p}`10.7554/eLife.59045`. The authors used Matlab (<rrid:SCR_001622>) in their analysis.

Click on one of the RRIDs below to see additional metadata!

```{list-table}
:header-rows: 1

* - Resource type
  - Designation
  - Source
  - Identifiers

* - Strain (M. musculus)
  - rTg4510, Tg(Camk2a-tTA)
  - ENVIGO
  - <rrid:MGI:4819951>

* - Software, algorithm
  - Klusta suite
  - {cite}`10.1038/nn.4268`
  - <rrid:SCR_014480>

* - Software, algorithm
  - MATLAB R2019b
  - [Mathworks](https://uk.mathworks.com/)
  - <rrid:SCR_001622>\
    <rrid:SCR_005547>

* - Software, algorithm
  - OriginPro 2019b
  - [OriginLab](https://www.originlab.com/)
  - <rrid:SCR_014212>
```
````

## Research Organization Registry

The Research Organization Registry (ROR) is a global, community-led registry of open persistent identifiers for research organizations. You can add these to your MyST frontmatter or use the links directly in your documents.

To create an ROR link, use the `ror:` protocol followed by the identifier, for example:

- `[](ror:03rmrcq20)` becomes [](ror:03rmrcq20)
- `<ror:03rmrcq20>` becomes <ror:03rmrcq20>

You may also use a URL similar to `https://ror.org/03rmrcq20`. To find your organization use the search provided at [ror.org](https://ror.org)
