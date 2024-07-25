---
title: Citations and Bibliography
short_title: Citations & Bibliography
description: Add academic citations to your documents easily, have hover-references and an automatically created bibliography.
thumbnail: ./thumbnails/citations.png
---

Citations automatically show up in your site, including a references section at the bottom of the page. These citations are able to be clicked on to see more information, like the abstract. There are two different ways to add citations to your documents: (1) adding a markdown link to a [DOI](wiki:Digital_object_identifier); and (2) by adding a BibTeX file, which can be exported from any reference manager, and adding a `cite` role to your content.

(doi-links)=

## Simple Referencing with a DOI Link

Link to any DOI in your markdown files or Jupyter Notebooks by including a link to the DOI. Provided the `DOI` is formatted correctly, this will be transformed during the build process to a citation with a pop-up panel on hover like this: [Cockett, 2022](https://doi.org/10.5281/zenodo.6476040), and the reference information will be automatically added to the reference section at the bottom of your notebook (see below👇).

```md
This is a link in markdown: [Cockett, 2022](https://doi.org/10.5281/zenodo.6476040).
```

It is also possible to to drop the link text, that is:\
`<doi:10.5281/zenodo.6476040>` or `[](doi:10.5281/zenodo.6476040)`,\
which will insert the citation text in the correct format (e.g. adding an italic "_et al._", etc.). If the DOI is present on a citation from a BibTeX file in your project, that citation will be used. Otherwise, the citation data for these DOIs will be downloaded from `https://doi.org` once and cached to a local file in the `_build` directory. This cache may be cleared with `myst clean --cache`.

Providing your DOIs as full links has the advantage that on other rendering platforms (e.g. GitHub), your citation will still be shown as a link. If you have many citations, however, this will slow down the build process as the citation information is fetched dynamically.

:::{note} Dealing with complex DOIs
:class: dropdown
If your DOI does not follow modern standards (e.g. strange characters or contains multiple `/`s), you must include the `https://doi.org` in the URL and may have to URL encode the DOI string to be recognized as a URL in markdown.

For the DOI, `10.1175/1520-0493(1972)100<0081:OTAOSH>2.3.CO;2` there are `<`, `;` and `()` characters that do not work well with markdown URL parsing. There are two options:

1. use the service https://shortdoi.org, which will give you a unique, persistent smaller DOI that will parse correctly, in this case `https://doi.org/cr3qwn` (which becomes https://doi.org/cr3qwn); or
2. URL encode this to: \
   `https://doi.org/10.1175%2F1520-0493%281972%29100%3C0081%3AOTAOSH%3E2.3.CO%3B2`, which also becomes https://doi.org/10.1175%2F1520-0493%281972%29100%3C0081%3AOTAOSH%3E2.3.CO%3B2[^brackets].

[^brackets]: In this case we can also optionally encode the brackets as `%28` and `%29`. There aren't too many of these in the wild, so hopefully it isn't too bad!!

For DOIs with multiple slashes in the identifier you also have to use the full https://doi.org URL, for example, `https://doi.org/10.3847/1538-4365/ac5f56` becomes <https://doi.org/10.3847/1538-4365/ac5f56>.

:::

### Writing DOIs to BibTeX

If you encounter problems fetching DOIs from `https://doi.org`, for example the downloaded citation does not include all the data you expect or requests to `https://doi.org` are failing on an automated continuous integration platform, you may write your DOI citations to file using the MyST command

```bash
myst build --doi-bib
```

This will generate a BibTeX file `myst.doi.bib` which you may then rename, edit, and save to your project. On subsequent builds, the DOIs will be loaded from this file rather than fetched remotely.

## Including BibTeX

A standard way of including references for $\LaTeX$ is using <wiki:BibTeX>, you can include a `*.bib` file or files in the same directory as your content directory for the project. These will provide the reference keys for that project.

If you want to explicitly reference which BibTeX files to use, as well as what order to resolve them in, you can use the `bibliography` field in your frontmatter, which is a string array of local or remote files. This will load the files in order specified.

```yaml
bibliography:
  - my_references.bib
  - https://example.com/my/remote/bibtex.bib
```

The remote BibTeX can be helpful for working with reference managers that support remote links to your references.

## Markdown Citations

You can add citations to any BibTeX entry using the citation key preceded by an `@`, for example, `@author2023`.
This syntax follows the [pandoc citation syntax](https://pandoc.org/MANUAL.html#citation-syntax). Multiple citations can be grouped together with square brackets, separated with semi-colons. It is also possible to add a prefix or suffix to parenthetical citations, for example, `[e.g. @author2023, chap. 3; @author1995]`. To add a suffix to a narrative citation, follow the citation with the suffix in square brackets, for example, `@author2023 [chap. 3]`. As with a link to a DOI, you can also use the DOI directly instead of the BibTeX key.

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

## Citation Roles

MyST also provides a number of roles for compatibility with Sphinx and Jupyter Book. To create a citation role in Markdown, use either a parenthetical or textual citation:

```md
This is a parenthetical citation {cite:p}`cockett2015`.
You can also use a narrative citation with {cite:t}`cockett2015`.
You can also use a narrative citation with {cite:p}`cockett2015; heagy2017`.
You can also add prefix and suffix {cite:p}`{see}cockett2015{fig 1}`.
```

This is the difference between: {cite:p}`cockett2015` and {cite:t}`cockett2015`. You can have many citation keys in a single role, by separating them with a semicolon, `;`, for example: {cite:p}`cockett2015; heagy2017`.
Including a prefix or suffix is displayed as {cite:p}`{see}cockett2015{fig 1}`.

You can also include DOIs in citations (`cite`, `cite:t`, and `cite:p`) which will be linked in the same way as a simple markdown link, but will match the reference style of the project.

```md
This will be a citation: {cite}`10.1093/nar/22.22.4673`.
```

This will show as: {cite}`10.1093/nar/22.22.4673`.
