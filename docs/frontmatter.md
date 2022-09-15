---
title: Frontmatter
description: Frontmatter can be set at the top of your documents to change the look and feel of your articles.
thumbnail: thumbnails/frontmatter.png
---

Frontmatter allows you to specify metadata and options about how your project should behave or render.
Included in frontmatter are things like the document or project `title`, what `thumbnail` to use for site or content previews, `authors` that contributed to the work, and scientific identifiers like a `doi`.
Adding frontmatter ensures that these properties are available to downstream tools or build processes like building [](./creating-pdf-documents.md).

## Where to set frontmatter

Frontmatter can be set in a markdown (`md`) or notebook (`ipynb`) file (described as a “page” below) or in the `project:` section of a `myst.yml` file. When set in a `myst.yml` file, those settings will be applied to all content in that same folder and subfolders (apart from “page only” fields).

### In a MyST markdown file

A frontmatter section can be added at the top of any `md` file using `---` delimiters.

```yaml
---
title: My First Article
date: 2022-05-11
authors:
  - name: Jane Bloggs
    affiliations:
      - University of Europe
---
```

### In a Jupyter Notebook

Frontmatter can be added to the first cell of a Jupyter Notebook, that cell should be a Markdown cell and use `---` delimiters as above.

```{important}
**Note**

Remember to format the contents of the section as valid `yaml` even though when rendered, the cell will not look well formated in your notebook.

```

### In a markdown-based notebook

If your Jupyter Notebook is described as a markdown file (e.g. using [jupytext](https://jupytext.readthedocs.io/en/latest/formats.html), or [MyST](https://jupyterbook.org/en/stable/file-types/myst-notebooks.html)), then this should be included in the frontmatter section as usual in addition to the `jupyter` key that defines the kernel and jupytext metadata.

### In a `myst.yml` file

Frontmatter fields can be added directly to any `project:` section within a `myst.yml` file. If your root `myst.yml` file only contains a `site:` section, and you want to add frontmatter, add a `project:` section at the top level and add the fields there. e.g.

```yaml
myst: v1
site: ...
project:
  license: CC-BY-4.0
  open_access: true
```

+++

## Available frontmatter fields

The following table lists the available frontmatter fields, a brief description and a note on how the field behaves depending on whether it is set on a page or at the project level. Where a field itself is an object with sub-fields, see the relevant description on the page below.

```{list-table} A list of available frontmatter fields and their behaviour across projects and pages
:header-rows: 1
:name: wmDcYPnNQf

* - field
  - description
  - field behaviour
* - `title`
  - a string (max 500 chars)
  - page & project
* - `description`
  - a string (max 500 chars)
  - page & project
* - `short_title`
  - a string (max 40 chars)
  - page & project
* - `name`
  - a string (max 500 chars)
  - page & project
* - `tags`
  - a list of strings
  - page only
* - `thumbnail`
  - a link to a local or remote image
  - page only
* - `subtitle`
  - a string (max 500 chars)
  - page only
* - `date`
  - a valid date formatted string
  - page can override project
* - `authors`
  - a list of author objects
  - page can override project
* - `doi`
  - a valid DOI, either URL or id
  - page can override project
* - `arxiv`
  - a valid arXiv reference, either URL or id
  - page can override project
* - `open_access`
  - boolean (true/false)
  - page can override project
* - `license`
  - a license object or a string
  - page can override project
* - `github`
  - a valid GitHub URL or `owner/reponame`
  - page can override project
* - `binder`
  - any valid URL
  - page can override project
* - `subject`
  - a string (max 40 chars)
  - page can override project
* - `venue`
  - a venue object
  - page can override project
* - `biblio`
  - a biblio object with various fields
  - page can override project
```

+++

## Field Behaviour

Frontmatter can be attached to a “page”, meaning a local `.md` or `.ipynb` or a “project”. However, individual frontmatter fields are not uniformly available at both levels, and behaviour of certain fields are different between project and page levels. There are three field behaviours to be aware of:

`page & project`
: the field is available on both the page & project but they are independent

`page only`
: the field is only available on pages, and not present on projects and it will be ignored if set there.

`page can override project`
: the field is available on both page & project but the value of the field on the page will override any set of the project. Note that the page field must be omitted or undefined, for the project value to be used, value of `null` (or `[]` in the case of `authors`) will still override the project value but clear the field for that page.

+++

## Thumbnail

The thumbnail is used in previews for your site in applications like Twitter, Slack, or any other link preview service. This should, by convention, be included in a `thumbnails` folder next to your content, if you do not want this thumbnail, you can explicitly set it to another image on your local file system or a remote URL to an image. This image will get copied over to your public folder and optimized when you build your project.

```yaml
thumbnail: thumbnails/myThumbnail.png
```

If you do not specify an image the first image in the content of a page will be selected. If you explicitly do not want an image, set `thumbnail` to `null`.

## Authors

The `authors` field is a list of `author` objects. Available fields in the author object are:

````{list-table}
:header-rows: 1
* - field
  - description
* - `name`
  - a string - the author’s full name
* - `orcid`
  - a string - a valid ORCID identifier
* - `corresponding`
  - boolean (true/false) - flags any corresponding authors
* - `email`
  - a string - email of the author, required if `corresponding` is `true`
* - `roles`
  - a list of strings - must be valid [CRT Contributor Roles](https://credit.niso.org/)

    ```yaml
    authors:
      - name: Jane Bloggs
        roles:
          - Conceptualization
          - Data curation
          - Validation
    ```
* - `affiliations`
  - a list of strings - freeform affiliation names, e.g.

    ```yaml
    authors:
      - name: Jane Bloggs
        affiliations:
      	  - ACME inc
          - Earth University
    ```

````

## Date

The date field is a string and should conform to a valid Javascript data format. Examples of acceptable date formats are:

- `2021-12-14T10:43:51.777Z` - [an ISO 8601 calendar date extended format](https://262.ecma-international.org/11.0/#sec-date-time-string-format), or
- `14 Dec 2021`
- `14 December 2021`
- `2021, December 14`
- `2021 December 14`
- `12/14/2021` - `MM/DD/YYYY`
- `12-14-2021` - `MM-DD-YYYY`
- `2022/12/14` - `YYYY/MM/14`
- `2022-12-14` - `YYYY-MM-DD`

Where the latter example in that list are valid [IETF timestamps](https://datatracker.ietf.org/doc/html/rfc2822#page-14)

## Licenses

This field can be set to a string value directly or to a License object.

Available fields in the License object are `content` and `code` allowing licenses to be set separately for these two forms of content, as often different subsets of licenses are applicable to each. If you only wish to apply a single license to your page or project use the string form rather than an object.

String values for licenses should be a valid “Identifier” string from the [SPDX License List](https://spdx.org/licenses/). Identifiers for well-known licenses are easily recognizable, but can be more specific than you are used to, for example:

```{list-table}
:header-rows: 1
:name: ovrQAe267C
* - Common Content Licenses
  - Common Code Licenses

* - - `CC-BY-4.0`
    - `CC-BY-SA-4.0`
    - `CC-BY-N-SA-4.0`
    - `CC0-1.0`

  - - `MIT`
    - `BSD`
    - `GPL-3.0+`
    - `Apache-2.0`
    - `LGPL-3.0-or-later`
    - `AGPL`
```

By using the correct SPDX Identifier, your website will automatically use the appropriate icon for the license and link to the license definition.

## Venue

The term `venue` is borrowed from the [OpenAlex](https://docs.openalex.org/about-the-data/venue) API definition:

> Venues are where works are hosted.

Available fields in the `venue` object are `title` and `url`.

Some typical `venue` values may be:

```yaml
venue:
  title: Journal of Geophysics
  url: https://journal.geophysicsjournal.com
```

or

```yaml
venue:
  title: EuroSciPy 2022
  url: https://www.euroscipy.org/2022
```

## Biblio

The term `biblio` is borrowed from the [OpenAlex](https://docs.openalex.org/about-the-data/venue) API definition:

> Old-timey bibliographic info for this work. This is mostly useful only in citation/reference contexts. These are all strings because sometimes you'll get fun values like "Spring" and "Inside cover."

Available fields in the `biblio` object are `volume`, `issue`, `first_page` and `last_page`.

Some example `biblio` values may be:

```yaml
biblio:
  volume: '42'
  issue: '3'
  first_page: '1' # can be a number or string
  last_page: '99' # can be a number or string
```

OR

```yaml
biblio:
  volume: '2022'
  issue: Winter
  first_page: Inside cover # can be a number or string
```
