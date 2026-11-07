---
title: Citations and Bibliography
short_title: Citations & Bibliography
description: Add academic citations to your documents easily, have hover-references and an automatically created bibliography.
thumbnail: ./thumbnails/citations.png
---

Citations automatically show up in your site, including a references section at the bottom of the page.
These citations are able to be clicked on to see more information, like the abstract.
There are two different ways to add citations to your documents:

1. Add a Markdown link to a [DOI](wiki:Digital_object_identifier); and
2. Add a BibTeX file, which can be exported from any reference manager, and adding a `cite` role to your content.

(doi-links)=

## Simple Referencing with a DOI Link

Link to any DOI in your Markdown files or Jupyter Notebooks by including a link to the DOI.
This will be transformed to a citation with a pop-up panel on hover like this: [Cockett, 2022](https://doi.org/10.5281/zenodo.6476040), and the reference information will be added to the reference section at the bottom of the page. Here's some example syntax:

```md
This is a link in Markdown: [Cockett, 2022](https://doi.org/10.5281/zenodo.6476040).
```

To automatically insert the citation text, provide a standalone DOI link without link text:

- `[](doi:10.5281/zenodo.6476040)`
- `<doi:10.5281/zenodo.6476040>`

For example: <https://doi.org/10.5281/zenodo.6476040>.

If the BibTeX file in your project has this DOI, that citation will be used.

If the BibTex file does not have this DOI, the citation data will be downloaded from `https://doi.org` (and cached to a local file in the `_build` directory).

**Clear the DOI cache** with : `myst clean --cache`.

**To modify the style of the inserted citation text**: Use the styles in {ref}`table-pandoc-citations` (this works with or without a BibTeX file)

:::{warning} Many citations will slow down your build
If you have many citations that aren't present in a local BibTeX file, it may slow down the build process as the citation information is fetched dynamically.
:::

:::{note} Dealing with complex DOIs
:class: dropdown
If your DOI does not follow modern standards (e.g. strange characters or contains multiple `/`s), you must include the `https://doi.org` in the URL and may have to URL encode the DOI string to be recognized as a URL in Markdown.

For the DOI, `10.1175/1520-0493(1972)100<0081:OTAOSH>2.3.CO;2` there are `<`, `;` and `()` characters that do not work well with Markdown URL parsing. There are two options:

1. use the service https://shortdoi.org, which will give you a unique, persistent smaller DOI that will parse correctly, in this case `https://doi.org/cr3qwn` (which becomes https://doi.org/cr3qwn); or
2. URL encode this to: \
   `https://doi.org/10.1175%2F1520-0493%281972%29100%3C0081%3AOTAOSH%3E2.3.CO%3B2`, which also becomes https://doi.org/10.1175%2F1520-0493%281972%29100%3C0081%3AOTAOSH%3E2.3.CO%3B2[^brackets].

[^brackets]: In this case we can also optionally encode the brackets as `%28` and `%29`. There aren't too many of these in the wild, so hopefully it isn't too bad!!

For DOIs with multiple slashes in the identifier you also have to use the full https://doi.org URL, for example, `https://doi.org/10.3847/1538-4365/ac5f56` becomes <https://doi.org/10.3847/1538-4365/ac5f56>.

:::

### Numbered Citations

The default citations are narrative, for numbered citations, these can be set in the `site.options.numbered_references` in your `myst.yml` (See [](#site-options)).
For numbered citations in all exports, use a numeric [citation style](#citation-styles), for example `ieee`.

```{code} yaml
:filename: myst.yml
site:
  options:
    numbered_references: true
```

![](#page-site-options-note)

### Writing DOIs to BibTeX

If you encounter problems fetching DOIs from `https://doi.org`, for example the downloaded citation does not include all the data you expect or requests to `https://doi.org` are failing on an automated continuous integration platform, you may write your DOI citations to file using the MyST command:

```bash
myst build --doi-bib
```

This will generate a BibTeX file `myst.doi.bib` which you may then rename, edit, and save to your project.
On subsequent builds, the DOIs will be loaded from this file rather than fetched remotely.

## Including BibTeX

A standard way of including references for $\LaTeX$ is using <wiki:BibTeX>, you can include a `*.bib` file or files in the same directory as your content directory for the project. These will provide the reference keys for that project.

If you want to explicitly reference which BibTeX files to use, as well as what order to resolve them in, you can use the `bibliography` field in your frontmatter, which is a string array of local or remote files.
This will load the files in order specified.

```yaml
bibliography:
  - my_references.bib
  - https://example.com/my/remote/bibtex.bib
```

The remote BibTeX can be helpful for working with reference managers that support remote links to your references.

(citation-styles)=

## Citation Styles

MyST uses the [Citation Style Language](https://citationstyles.org) (CSL) to format citations and the bibliography.
The default style is APA.
To use a different style, set `citation_style` in the project or page frontmatter:

```{code} yaml
:filename: myst.yml
project:
  bibliography:
    - references.bib
  citation_style: ieee
```

The value of `citation_style` can be:

- `apa`, `vancouver`, or `harvard1`. These styles are included in MyST.
- The name of a style in the [CSL style repository](https://github.com/citation-style-language/styles), for example `ieee`, `chicago-author-date`, or `nature`. MyST downloads the style and keeps it in the `_build` cache.
- A path to a local `.csl` file, for example `styles/my-journal.csl`. In `myst.yml`, the path is relative to `myst.yml`. In page frontmatter, the path is relative to the page.
- A URL of a `.csl` file.

You can find styles with the [Zotero style repository](https://www.zotero.org/styles).
If a style is a _dependent_ style (a journal that uses the format of a different style), MyST loads its parent style.
If MyST cannot load the style, it shows a warning and uses APA.

### Bibliography Files and CSL Styles

A CSL style specifies the format.
A bibliography file specifies the data.
You can use a BibTeX file with any CSL style.
MyST converts each BibTeX entry to CSL data, and the style formats that data.

The conversion from BibTeX to CSL has some limits:

- Braces that protect capitalization, for example `{NumPy}`, are kept. Styles that change titles to title case or sentence case do not change protected text.
- Some LaTeX commands in fields, for example accents or math, can show incorrectly.
- Some BibTeX fields have no CSL equivalent, for example `howpublished` and `crossref`. Each style shows these fields differently, or does not show them.

### How MyST Formats Citations

MyST formats all citations on a page together, in the order that they occur:

- Numeric styles, for example `ieee`, give each reference a number in the order of its first citation. The numbers start at 1 on each page.
- Author-date styles, for example `apa`, add a letter to the year when one author has more than one work in the same year, for example `2019a` and `2019b`.
- The style sorts the bibliography. Author-date styles usually sort by author. Numeric styles usually sort by number.
- The style sorts the citations in a group, for example `[@smith2019; @jones2020]`.
- A narrative citation, for example `@smith2019`, shows the authors and the citation, for example "Smith (2019)" or "Smith [1]".
- Each citation in a group is a separate link. Thus, MyST does not combine citations into ranges, for example, `[1]–[3]`, or combine works by the same author, for example "Smith 2019a, 2019b".
- Styles for footnote citations (CSL "note" styles) show the citation in the text, not in a footnote.

The `site.options.numbered_references` option of the book theme shows the reference number in place of the citation text.
With a numeric citation style, you do not need this option.

### Citation Styles in Exports

Each export uses one of two modes for citations:

`rendered`
: MyST formats the citations and the bibliography with the CSL style.
  The export contains the formatted text.

`native`
: MyST writes a bibliography file and citation commands.
  The typesetting tool formats the citations with the style of the template.

```{list-table} Citation modes of exports
:header-rows: 1
* - Export
  - Mode
  - Style of the citations
* - Website
  - `rendered`
  - `citation_style`
* - Word (`.docx`)
  - `rendered`
  - `citation_style`
* - JATS
  - `rendered`
  - `citation_style`
* - $\LaTeX$ and PDF
  - `native`
  - The template. MyST writes `main.bib` and `\cite` commands. The template sets the style with natbib (`\bibliographystyle`) or biblatex (`style=`).
* - Typst and PDF
  - `native`
  - The template. MyST writes `main.bib` and `#cite` commands.
```

Use `native` mode to submit a document to a journal.
Journals usually supply a template with their BibTeX or biblatex style, and some journals require the `.bib` or `.bbl` file.
In `native` mode, `citation_style` has no effect on the export.

:::{note} Planned: `rendered` mode for $\LaTeX$ and Typst
A `citations` export option will select the mode for $\LaTeX$ and Typst exports:

```{code} yaml
:filename: myst.yml
project:
  citation_style: ieee
  exports:
    - format: pdf
      template: lapreprint
      citations: rendered
```

In `rendered` mode, MyST writes the formatted citations and a `thebibliography` environment, so the PDF and the website show the same citations.
The template must not load natbib or biblatex in `rendered` mode.
In `native` mode, Typst can also use `citation_style`, because Typst reads CSL styles.
:::

## Markdown Citations

You can add citations to any BibTeX entry using the citation key preceded by an `@`, for example, `@author2023`.
This syntax follows the [pandoc citation syntax](https://pandoc.org/MANUAL.html#citation-syntax).
Multiple citations can be grouped together with square brackets, separated with semi-colons.
It is also possible to add a prefix or suffix to parenthetical citations, for example, `[e.g. @author2023, chap. 3; @author1995]`.
To add a suffix to a narrative citation, follow the citation with the suffix in square brackets, for example, `@author2023 [chap. 3]`.
As with a link to a DOI, you can also use the DOI directly instead of the BibTeX key.

```{list-table} Examples of Markdown citations
:header-rows: 1
:label: table-pandoc-citations
* - Markdown
  - Rendered
  - Explanation
* - `@cockett2015`
  - @cockett2015
  - Narrative citation
* - `[@cockett2015]`
  - [@cockett2015]
  - Parenthetical citation
* - `[@cockett2015; @heagy2017]`
  - [@cockett2015; @heagy2017]
  - Multiple parenthetical citations
* - `[-@cockett2015]`
  - [-@cockett2015]
  - Show citation year
* - `[e.g. @cockett2015, pg. 22]`
  - [e.g. @cockett2015, pg. 22]
  - Prefix and suffix
* - `@cockett2015 [pg. 22]`
  - @cockett2015 [pg. 22]
  - Suffix for narrative citations
* - `@10.1093/nar/22.22.4673`
  - @10.1093/nar/22.22.4673
  - Citation using a DOI directly
```

Citations that are embedded in links will _not_ be parsed as citations.
For example: [@jupyter-book](https://github.com/jupyter-book) or https://hackmd.io/@turingway/B1OnVLe-3.

:::{note} Mixing URLs and `@citations`
If you have a citation directly after a URL without whitespace, it may be treated as part of the URL rather than as a citation.

For example, `https://mystmd.org,@scipy2025` will treat `@scipy2025` as part of the URL. To cite after a URL, add a space (`See https://mystmd.org, @scipy2025`) or use angle brackets (`See <https://mystmd.org>,@scipy2025`).

**Avoid URLs with @ in square brackets**. A URL with `@` inside square brackets like `[https://hackmd.io/@user]` will be parsed as a citation, to avoid this you can escape the first bracket with a backslash `\[`.
:::

## Citation Roles

MyST also provides a number of roles for compatibility with Sphinx and Jupyter Book V1.
To create a citation role in Markdown, use either a parenthetical or textual citation:

```md
This is a parenthetical citation {cite:p}`cockett2015`.
You can also use a narrative citation with {cite:t}`cockett2015`.
You can also use a narrative citation with {cite:p}`cockett2015; heagy2017`.
You can also add prefix and suffix {cite:p}`{see}cockett2015{fig 1}`.
```

This is the difference between: {cite:p}`cockett2015` and {cite:t}`cockett2015`. You can have many citation keys in a single role, by separating them with a semicolon, `;`, for example: {cite:p}`cockett2015; heagy2017`.
Including a prefix or suffix is displayed as {cite:p}`{see}cockett2015{fig 1}`.

You can also include DOIs in citations (`cite`, `cite:t`, and `cite:p`) which will be linked in the same way as a simple Markdown link, but will match the reference style of the project.

```md
This will be a citation: {cite}`10.1093/nar/22.22.4673`.
```

This will show as: {cite}`10.1093/nar/22.22.4673`.
