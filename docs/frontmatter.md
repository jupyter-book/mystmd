---
title: Frontmatter
description: Frontmatter can be set at the top of your documents to change the look and feel of your articles.
thumbnail: thumbnails/frontmatter.png
---

Frontmatter allows you to specify metadata and options about how your project should behave or render.
Included in frontmatter are things like the document or project `title`, what `thumbnail` to use for site or content previews, `authors` that contributed to the work, and scientific identifiers like a `doi`.
Adding frontmatter ensures that these properties are available to downstream tools or build processes like building [](./creating-pdf-documents.md).

## Where to set frontmatter

Frontmatter can be set in a markdown (`md`) or notebook (`ipynb`) file (described as a “page” below) or in the `project:` section of a `myst.yml` file. When project frontmatter is set in a `myst.yml` file, those settings will be applied to all content in that project (apart from “page only” fields).

### In a MyST markdown file

A frontmatter section can be added at the top of any `md` file using `---` delimiters.

```yaml
---
title: My First Article
date: 2022-05-11
authors:
  - name: Mason Moniker
    affiliations:
      - University of Europe
---
```

### In a Jupyter Notebook

Frontmatter can be added to the first cell of a Jupyter Notebook, that cell should be a Markdown cell and use `---` delimiters as above.

:::{important} Install JupyterLab Myst
To have properly formatted frontmatter, you can install the `jupyterlab-myst` plugin for Jupyter. See the [quickstart tutorial](./quickstart-jupyter-lab-myst.md).

Without the extension installed, remember to format the contents of the section as valid `yaml` even though when rendered, the cell will not look well formatted in your notebook.
:::

:::{note} Using `jupytext` or a Markdown-based notebook?
:class: dropdown
If your Jupyter Notebook is described as a markdown file (e.g. using [jupytext](https://jupytext.readthedocs.io/en/latest/formats-markdown.html), or [MyST](https://jupyterbook.org/en/stable/file-types/myst-notebooks.html)), then this should be included in the frontmatter section as usual in addition to the `jupyter` key that defines the kernel and jupytext metadata.
:::

### In a `myst.yml` file

Frontmatter fields can be added directly to any `project:` section within a `myst.yml` file. If your root `myst.yml` file only contains a `site:` section, and you want to add frontmatter, add a `project:` section at the top level and add the fields there. e.g.

```yaml
version: 1
site: ...
project:
  license: CC-BY-4.0
  open_access: true
```

(composing-myst-yml)=

#### Composing multiple `.yml` files

You may separate your frontmatter into multiple, composable files. To reference other files from your main `myst.yml` file, use the `extends` key with relative path(s) to the other configuration files:

```yaml
version: 1
site: ...
project: ...
extends:
  - ../macros.yml
  - ../funding.yml
```

Each entry listed under `extends` may be a relative path to a file or a URL. URLs must be direct links to files which are downloaded and cached locally. The files must contain valid `myst.yml` structure with `version: 1` and `site` or `project` keys. They may also have additional entries listed under `extends`.

Composing files together this way allows you to have a single source of truth for project frontmatter that may be reused across multiple projects, for example math macros or funding information.

When using `extends` to compose configuration files, list-type fields are combined, rather than replaced. This means, for example, you may define a single export in one file:

```yaml
version: 1
project:
  export:
    format: meca
```

Then, any `myst.yml` file that extends this file will have a `meca` export in addition to any other exports it defines. This behavior applies to the list fields: `tags`, `keywords`, `exports`, `downloads`, `funding`, `resources`, `requirements`, `bibliography`, `editors`, and `reviewers`. The fields `exports` and `downloads` are deduplicated by `id`, so if you wish to override a value from an inherited configuration you may assign it the same `id`. Other fields cannot be overridden; instead, shared configurations should be as granular and shareable as possible.

+++

## Available frontmatter fields

The following table lists the available frontmatter fields, a brief description and a note on how the field behaves depending on whether it is set on a page or at the project level. Where a field itself is an object with sub-fields, see the relevant description on the page below.

```{list-table} A list of available frontmatter fields and their behavior across projects and pages
:header-rows: 1
:label: table-frontmatter

* - field
  - description
  - field behavior
* - `title`
  - a string (max 500 chars, see [](#titles))
  - page & project
* - `subtitle`
  - a string (max 500 chars, see [](#titles))
  - page & project
* - `short_title`
  - a string (max 40 chars, see [](#titles))
  - page & project
* - `description`
  - a string (max 500 chars)
  - page & project
* - `exports`
  - an export object, see [](./documents-exports.md)
  - page & project
* - `downloads`
  - a download object, see [](./website-downloads.md)
  - page & project
* - `label`
  - a string (max 500 chars) to identify the page in cross-references
  - page only
* - `tags`
  - a list of strings. Use to categorize posts/articles or the project to make it easier for readers to find related content within your site.
  - page & project
* - `thumbnail`
  - a link to a local or remote image
  - page & project
* - `banner`
  - a link to a local or remote image
  - page & project
* - `parts`
  - a dictionary of arbitrary content parts, not part of the main article, for example `abstract`, `data_availability` see [](./document-parts.md).
  - page & project
* - `date`
  - a valid date formatted string
  - page can override project
* - `keywords`
  - a list of strings. Use in articles to highlight key concepts and facilitate indexing in scientific databases.
  - page can override project
* - `authors`
  - a list of author objects, see [](#frontmatter:authors)
  - page can override project
* - `reviewers`
  - a list of author objects or string ids, see [](#other-contributors)
  - page can override project
* - `editors`
  - a list of author objects or string ids, see [](#other-contributors)
  - page can override project
* - `affiliations`
  - a list of affiliation objects, see [](#affiliations)
  - page can override project
* - `doi`
  - a valid DOI, either URL or id
  - page can override project
* - `arxiv`
  - a valid arXiv reference, either URL or id
  - page can override project
* - `pmid`
  - a valid PubMed ID, an integer
  - page can override project
* - `pmcid`
  - a valid PubMed Central ID, a string 'PMC' followed by numeric digits
  - page can override project
* - `open_access`
  - boolean (true/false)
  - page can override project
* - `license`
  - a license object or a string, see [](#licenses)
  - page can override project
* - `copyright`
  - a string
  - page can override project
* - `funding`
  - a funding object, see [](#frontmatter:funding)
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
  - a venue object with journal and conference metadata fields
  - page can override project
* - `volume`
  - information about the journal volume, see [](#publication-metadata)
  - page can override project
* - `issue`
  - information about the journal issue, see [](#publication-metadata)
  - page can override project
* - `first_page`
  - first page of the project or article, for published works
  - page can override project
* - `last_page`
  - last page of the project or article, for published works
  - page can override project
* - `math`
  - a dictionary of math macros (see [](#math-macros))
  - page can override project
* - `abbreviations`
  - a dictionary of abbreviations in the project (see [](#abbreviations))
  - page can override project
* - `numbering`
  - object for customizing content numbering (see [](#numbering))
  - page can override project
* - `options`
  - a dictionary of arbitrary options validated and consumed by templates, for example, during site or PDF build
  - page can override project
* - `id`
  - id for the project, intended as a unique identifier as the project is used across different contexts
  - project only
* - `references`
  - configuration for intersphinx references (see [](#intersphinx))
  - project only
* - `requirements`
  - files required for reproducing the executional environment, included in the MECA bundle to enable portable execution
  - project only
* - `resources`
  - other resources associated with your project, distributed in the MECA bundle
  - project only
* - `jupyter` or `thebe`
  - configuration for Jupyter execution (see [](./integrating-jupyter.md))
  - project only
* - `kernelspec`
  - configuration for the kernel (see [](#kernel-specification))
  - page only
```

+++

(field-behavior)=
## Field Behavior

Frontmatter can be attached to a “page”, meaning a local `.md` or `.ipynb` or a “project”. However, individual frontmatter fields are not uniformly available at both levels, and behavior of certain fields are different between project and page levels. There are three field behaviors to be aware of:

`page & project`
: the field is available on both the page & project but they are independent

`page only`
: the field is only available on pages, and not present on projects and it will be ignored if set there.

`page can override project`
: the field is available on both page & project but the value of the field on the page will override any set of the project. Note that the page field must be omitted or undefined, for the project value to be used, value of `null` (or `[]` in the case of `authors`) will still override the project value but clear the field for that page.

`project only`
: the field is only available on projects, and not present on pages and it will be ignored if set there.

+++

(titles)=

## Titles

There are several fields to title MyST projects and pages. Primary page and project titles can be specified simply as `title`. Pages and projects also both have `short_title`; this should provide a summarized title in less than 40 characters. It is used where space is limited, for example a site navigation panel, running-head titles in an static export, etc. On pages (not projects) you may specify `subtitle`; this conveys complimentary information to the title and may be displayed below the title.

````{note} Defining Page Title in Markdown

If `title` is not defined in the frontmatter, it will be pulled from the a heading at the top of the markdown instead. In this case, the heading will be removed from the content to the frontmatter for usage in a MyST site header or exported document title page.

```markdown
---
author: Marissa Myst
---

# My MyST Title

## Introduction

For this page, "My MyST Title" is the title!
...
```

If removing the title causes unexpected problems with the page formatting, you may set `title: null` in the frontmatter to prevent heading removal. The first heading will _still_ be copied as a placeholder title, but it will not be removed from the markdown. However, in these cases, it is probably easiest to simply define a title in frontmatter!
````

+++

(thumbnail-and-banner)=

## Thumbnail & Banner

The thumbnail is used in previews for your site in applications like Twitter, Slack, or any other link preview service. This should, by convention, be included in a `thumbnails` folder next to your content. You can also explicitly set this field to any other image on your local file system or a remote URL to an image. This image will get copied over to your public folder and optimized when you build your project.

```yaml
thumbnail: thumbnails/myThumbnail.png
```

If you do not specify an image the first image in the content of a page will be selected. If you explicitly do not want an image, set `thumbnail` to `null`.

You can also set a banner image which will show up in certain themes, for example, the `article-theme`:

```yaml
banner: banner.png
```

:::{figure} ./images/article-theme.png
:label: banner-example
Example of a banner in a site using the `article-theme`.
:::

(frontmatter:authors)=

## Authors

The `authors` field is a list of `author` objects. Available fields in the author object are:

````{list-table} Frontmatter information for authors
:header-rows: 1
:label: table-frontmatter-authors
* - field
  - description
* - `name`
  - a string OR CSL-JSON author object - the author’s full name; if a string, this will be parsed automatically. Otherwise, the object may contain `given`, `surname`, `non_dropping_particle`, `dropping_particle`, `suffix`, and full name `literal`
* - `id`
  - a string - a local identifier that can be used to reference a repeated author
* - `orcid`
  - a string - a valid ORCID identifier with or without the URL
* - `corresponding`
  - boolean (true/false) - flags any corresponding authors, you must include an `email` if true.
* - `email`
  - a string - email of the author, required if `corresponding` is `true`
* - `url`
  - a string - website or homepage of the author
* - `roles`
  - a list of strings - must be valid [CRediT Contributor Roles](https://credit.niso.org/)

    ```yaml
    authors:
      - name: Penny Crediton
        roles:
          - Conceptualization
          - Data curation
          - Validation
    ```

    :::{note} CRediT Roles
    :class: dropdown

    There are 14 official contributor roles that are in the NISO CRediT Role standard.
    In addition to British english, incorrect case or punctuation, there are also a number of aliases that can be used for various roles.

    | Official CRediT Role                                                                            | Alias               |
    | ----------------------------------------------------------------------------------------------- | ------------------- |
    | [Conceptualization](https://credit.niso.org/contributor-roles/conceptualization/)               | `conceptualisation` |
    | [Data curation](https://credit.niso.org/contributor-roles/data-curation/)                       |                     |
    | [Formal analysis](https://credit.niso.org/contributor-roles/formal-analysis/)                   | `analysis`          |
    | [Funding acquisition](https://credit.niso.org/contributor-roles/funding-acquisition/)           |                     |
    | [Investigation](https://credit.niso.org/contributor-roles/investigation/)                       |                     |
    | [Methodology](https://credit.niso.org/contributor-roles/methodology/)                           |                     |
    | [Project administration](https://credit.niso.org/contributor-roles/project-administration/)     | `administration`    |
    | [Resources](https://credit.niso.org/contributor-roles/resources/)                               |                     |
    | [Software](https://credit.niso.org/contributor-roles/software/)                                 |                     |
    | [Supervision](https://credit.niso.org/contributor-roles/supervision/)                           |                     |
    | [Validation](https://credit.niso.org/contributor-roles/validation/)                             |                     |
    | [Visualization](https://credit.niso.org/contributor-roles/visualization/)                       | `visualisation`     |
    | [Writing – original draft](https://credit.niso.org/contributor-roles/writing-original-draft/)   | `writing`           |
    | [Writing – review & editing](https://credit.niso.org/contributor-roles/writing-review-editing/) | `editing`, `review` |

    :::
* - `affiliations`
  - a list of strings that identify or create an affiliation or a full `Affiliation` object, for example:

    ```yaml
    authors:
      - name: Marissa Myst
        affiliations:
          - id: ubc
            institution: University of British Columbia
            ror: 03rmrcq20
            department: Earth, Ocean and Atmospheric Sciences
      	  - ACME Inc
      - name: Miles Mysterson
        affiliation: ubc
    ```

    See [](#affiliations) for more information on how to concisely write affiliations.
* - `equal_contributor`
  - a boolean (true/false), indicates that the author is an equal contributor
* - `deceased`
  - a boolean (true/false), indicates that the author is deceased
* - `twitter`
  - a twitter username
* - `github`
  - a GitHub username
* - `note`
  - a string, a freeform field to indicate additional information about the author, for example, acknowledgments or specific correspondence information.
* - `phone`
  - a phone number, e.g. `(301) 754-5766`
* - `fax`
  - for people who still use these machines, beep, boop, beeeep! 📠🎶
````

(other-contributors)=

### Reviewers, Editors, Funding Recipients

Other contributors besides authors may be listed elsewhere in the frontmatter. These include `reviewers`, `editors`, and [funding](#frontmatter:funding) award `investigators` and `recipients`. For all of these fields, you may use a full [author object](#frontmatter:authors), or you may use the string `id` from an existing author object defined elsewhere in your frontmatter.

(affiliations)=

## Affiliations

You can create an affiliation directly by adding it to an author, and it can be as simple as a single string.

```yaml
authors:
  - name: Marissa Myst
    affiliation: University of British Columbia
```

You can also add much more information to any affiliation, such as a ROR, ISNI, or an address. A very complete affiliations list for an author at the University of British Columbia is:

```yaml
authors:
  - name: Marissa Myst
    affiliations:
      - id: ubc
        institution: University of British Columbia
        ror: https://ror.org/03rmrcq20
        isni: 0000 0001 2288 9830
        department: Department of Earth, Ocean and Atmospheric Sciences
        address: 2020 – 2207 Main Mall
        city: Vancouver
        region: British Columbia
        country: Canada
        postal_code: V6T 1Z4
        phone: 604 822 2449
  - name: Miles Mysterson
    affiliation: ubc
```

Notice how you can use an `id` to avoid writing this out for every coauthor. Additionally, if the affiliation is a single string and contains a semi-colon `;` it will be treated as a list. The affiliations can also be added to your `project` frontmatter in your `myst.yml` and used across any document in the project.

::::{tab-set}
:::{tab-item} article.md

```yaml
---
title: My Article
authors:
  - name: Marissa Myst
    affiliation: ubc
  - name: Miles Mysterson
    affiliations: ubc; stanford
---
```

:::
:::{tab-item} myst.yml

```yaml
affiliations:
  - id: ubc
    institution: University of British Columbia
    ror: https://ror.org/03rmrcq20
    isni: 0000 0001 2288 9830
    department: Department of Earth, Ocean and Atmospheric Sciences
    address: 2020 – 2207 Main Mall
    city: Vancouver
    region: British Columbia
    country: Canada
    postal_code: V6T 1Z4
    phone: 604 822 2449
  - id: stanford
    name: ...
```

:::
::::

If you use a string that is not recognized as an already defined affiliation in the project or article frontmatter, an affiliation will be created automatically and normalized so that it can be referenced:

::::{tab-set}
:::{tab-item} Written Frontmatter

```yaml
authors:
  - name: Marissa Myst
    affiliations:
      - id: ubc
        institution: University of British Columbia
        ror: 03rmrcq20
        department: Earth, Ocean and Atmospheric Sciences
      - ACME Inc
  - name: Miles Mysterson
    affiliation: ubc
```

:::
:::{tab-item} Normalized

```yaml
authors:
  - name: Marissa Myst
    affiliations: ['ubc', 'ACME Inc']
  - name: Miles Mysterson
    affiliations: ['ubc']
affiliations:
  - id: ubc
    institution: University of British Columbia
    ror: https://ror.org/03rmrcq20
    department: Earth, Ocean and Atmospheric Sciences
  - id: ACME Inc
    name: ACME Inc
```

:::
::::

````{list-table} Frontmatter information for affiliations
:header-rows: 1
:label: table-frontmatter-affiliations
* - field
  - description
* - `id`
  - a string - a local identifier that can be used to reference a repeated affiliation
* - `name`
  - a string - the affiliation name. Either `name` or `institution` is required
* - `institution`
  - a string - Name of an institution or organization (for example, a university or corporation)

    If your research group has a name, you can use both `name` and `institution`,
    however, at least one of these is required.
* - `department`
  - a string - the affiliation department (e.g. Chemistry 🧪)
* - `doi`, `ror`, `isni`, `ringgold`
  - Identifiers for the affiliation (DOI, ROR, ISNI, and Ringgold).

    We suggest using https://ror.org if possible to search for your institution.

    ```yaml
    affiliations:
      - name: Boston University
        ringgold: 1846
        isni: 0000 0004 1936 7558
        ror: 05qwgg493
        doi: 10.13039/100018578
    ```
* - `email`
  - a string - email of the affiliation, required if `corresponding` is `true`
* - `address`, `city`, `state`, `postal_code`, and `country`
  - affiliation address information. In place of `state` you can use `province` or `region`.
* - `url`
  - a string - website or homepage of the affiliation (`website` is an alias!)
* - `phone`
  - a phone number, e.g. `(301) 754-5766`
* - `fax`
  - A fax number for the affiliation
* - `collaboration`
  - a boolean - Indicate that this affiliation is a collaboration, for example, `"MyST Contributors"` can be both an affiliation and a listed author. This is used in certain templates as well as in [JATS](https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/collab.html).
````

## Date

The date field is a string and should conform to a well-defined calendar date. Examples of acceptable date formats are:

- `2022-12-14` - `YYYY-MM-DD`
- `01 Jan 2000` - `DD? MON YYYY`
- `Sat, 1 Jan 2000` - `DAY, DD? MON YYYY`

These dates correspond to two main formats:

- A strict (full, extended) calendar date defined by [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) (see also [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339))
- A date-only variant of [RFC 2822](https://datatracker.ietf.org/doc/html/rfc2822), built using the RFC gammar rules.

(frontmatter:exports)=

## Exports

Exports allow you to generate static versions of your MyST documents, often through intermediary build engines like Latex.
For usage information, see [](./documents-exports.md).

```{list-table} Frontmatter export definitions
:header-rows: 1
:label: table-frontmatter-exports
* - field
  - description
* - `id`
  - a string - a local identifier that can be used to reference the export
* - `format`
  - one of `pdf` (built with $\LaTeX$ or Typst, depending on the template), `tex` (raw $\LaTeX$ files), `pdf+tex` (both PDF and raw $\LaTeX$ files) `typst` (raw Typst files and built PDF file), `docx`, `md`, `jats`, or `meca`
* - `template`
  - a string - name of an existing [MyST template](https://github.com/myst-templates) or a local path to a template folder. Templates are only available for `pdf`, `tex`, `typst`, and `docx` formats.
* - `output`
  - a string - export output filename with a valid extension or destination folder
* - `zip`
  - a boolean - if `true`, zip the output - only applies for multi-file exports `tex`, `pdf+tex` and `typst`.
* - `articles`
  - a list of strings - path(s) to articles to include in your export - this is required for exports defined in project frontmatter; for page frontmatter, the default article will be the page itself. Not all exports currently support multiple articles.
* - `toc`
  - a string - path to jupyterbook `_toc.yml` file - may be used as an alternative to listing `articles`
* - `sub_articles`
  - a list of strings - path(s) to sub-articles for `jats` export
```

(frontmatter:downloads)=

## Downloads

Downloads allow you to include downloadable files with a MyST website.
They are specified in either:

```{code-block} yaml
:filename: myst.yml
project:
  downloads:
    - file: ...
    - id: ...
```

In **page frontmatter**:

```{code-block} yaml
:filename: page.md
---
downloads:
  - file: ...
  - id: ...
---
```

See [](./website-downloads.md) information about how to use this feature.
Below is a list of all possible downloads configuration.

```{list-table} Frontmatter download definitions
:header-rows: 1
:label: table-frontmatter-downloads
* - field
  - description
* - `id`
  - a string - reference to an existing `export` identifier. The referenced export may be defined in a different file. If `id` is defined, `file`/`url` are not allowed.
* - `file`
  - a string - a path to a local file. If `file` is defined, `id`/`url` are not allowed.
* - `url`
  - a string - either a full URL or a relative URL of a page in your MyST project. If `url` is defined, `id`/`file` are not allowed.
* - `title`
  - a string - title of the `downloads` entry. This will show up as text on the link in your MyST site. `title` is recommended for all downloads, but only required for `url` values; files will default to `filename` title
* - `filename`
  - a string - name of the file upon download. By default, this will match the original filename. `url` values do no require a `filename`; if provided, the `url` will be treated as a download link rather than page navigation.
* - `static`
  - a boolean - this is automatically set to `true` for local files and `false` otherwise. You may also explicitly set this to `false`; this will bypass any attempt to find the file locally and will keep the value for `url` exactly as it is provided.
```

(licenses)=

## Licenses

This field can be set to a string value directly or to a License object.

Available fields in the License object are `content` and `code` allowing licenses to be set separately for these two forms of content, as often different subsets of licenses are applicable to each. If you only wish to apply a single license to your page or project use the string form rather than an object.

If selecting a license from the [SPDX License List](https://spdx.org/licenses/), you may simply use the “Identifier” string; MyST will expand these identifiers into objects with `name`, `url`, and additional metadata related to open access ([OSI-approved](https://opensource.org/licenses), [FSF free](https://www.gnu.org/licenses/license-list.en.html), and [CC](https://creativecommons.org/)). Identifiers for well-known licenses are easily recognizable (e.g. `MIT` or `BSD`) and MyST will attempt to infer the specific identifier if an ambiguous license is specified (e.g. `GPL` will be interpreted as `GPL-3.0+` and a warning raised letting you know of this interpretation). Some common licenses are:

```{list-table}
:header-rows: 1
:label: table-common-licenses

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

By using the correct SPDX Identifier, your website will automatically use the appropriate icon for the license and link to the license definition.  The simplest and most common example is something like:

```yaml
license: CC-BY-4.0
```

### Nonstandard licenses

Although not recommended, you may specify nonstandard licenses not found on the SPDX License List. For these, you may provide an object where available fields are `id`, `name`, `url`, and `note`. You can also extend the default SPDX Licenses by providing modified values for these fields. Here is a more complex example where content and code have different licenses; content uses an SPDX License with an additional note, and code uses a totally custom license.

```yaml
license:
  content:
    id: CC-BY-4.0
    note: When attributing this content, please indicate the Source was MyST Documentation.
  code:
    name: I Am Not A Lawyer License
    url: https://example.com/i-am-not-a-lawyer
```

(frontmatter:funding)=

## Funding

Funding frontmatter is able to contain multiple funding and open access statements, as well as award info.

It may be as simple as a single funding statement:

```yaml
funding: This work was supported by University.
```

Funding may also specify award id, name, sources ([affiliation object or reference](#affiliations)), investigators ([contributor objects or references](#other-contributors)), and recipients ([contributor objects or references](#other-contributors)).

```yaml
authors:
  - id: auth0
    name: Jane Doe
funding:
  statement: This work was supported by University.
  id: award-id-000
  name: My Award
  sources:
    - name: University
  investigators:
    - name: John Doe
  recipients:
    - auth0
```

Multiple funding objects with multiple awards are also possible:

```yaml
authors:
  - id: auth0
    name: Jane Doe
funding:
  - statement: This work was supported by University.
    awards:
      - id: award-id-000
        name: My First Award
        sources:
          - name: University
        investigators:
          - name: John Doe
        recipients:
          - auth0
      - id: award-id-001
        name: My Second Award
        sources:
          - name: University
        investigators:
          - name: John Doe
        recipients:
          - auth0
  - statement: Open access was supported by Consortium.
    open_access: Users are allowed to reproduce without prior permission
    awards:
      - id: open-award-999
        sources:
          - name: Consortium
```

## Venue

The term `venue` is borrowed from the [OpenAlex](https://docs.openalex.org/about-the-data/venue) API definition:

> Venues are where works are hosted.

For MyST frontmatter, the `venue` object holds metadata for journals and conferences where a work may be presented.

```{list-table} Available Venue fields
:header-rows: 1
:label: table-frontmatter-venue
* - field
  - description
* - `title`
  - full title of the venue
* - `short_title`
  - short title of the venue; often journals have a standard abbreviation that should be defined here
* - `url`
  - URL of the venue
* - `doi`
  - the _venue_ DOI
* - `number`
  - number of the venue in a series, for example the "18th Python in Science Conference"
* - `location`
  - physical location of a conference
* - `date`
  - date associated with the venue, for example the dates of a conference. This field is a string, not a timestamp, so it may be a date range.
* - `series`
  - title of a series that this venue or work is part of. Examples include a conference proceedings series, where each year a new conference-specific proceedings journal is created, or a category of articles across multiple issues, such as colloquium papers.
* - `issn`
  - ISSN for the publication
* - `publisher`
  - publisher of the journal
```

Some typical `venue` values may be:

```yaml
venue:
  title: Journal of Geophysics
  short_title: J. Geophys
  url: https://journal.geophysicsjournal.com
```

or

```yaml
venue:
  title: EuroSciPy 2022
  url: https://www.euroscipy.org/2022
```

(publication-metadata)=

## Publication Metadata

MyST includes several fields to maintain bibliographic metadata for journal publications. First, it has `first_page` and `last_page` - these are page numbers for the article in its printed form. Also, `volume` and `issue` are available to describe the journal volume/issue containing the article. Each of these properties has the same fields available, described in @table-frontmatter-biblio.


```{list-table} Available Volume and Issue fields
:header-rows: 1
:label: table-frontmatter-biblio
* - field
  - description
* - `number`
  - a string or a number to identify journal volume/issue
* - `title`
  - title of the volume/issue, if provided separately from number
* - `subject`
  - description of the subject of the volume/issue
* - `doi`
  - the volume/issue DOI
```

An example of publication metadata for an article may be:

```yaml
first_page: 1500
last_page: 1503
volume:
  number: 12
issue:
  name: Winter
  description: Special issue on software documentation
  doi: 10.62329/MYISSUE
```

These fields provide a more complete superset of publication metadata than the ["biblio" object defined by OpenAlex API](https://docs.openalex.org/about-the-data/venue):

> Old-timey bibliographic info for this work. This is mostly useful only in citation/reference contexts. These are all strings because sometimes you'll get fun values like "Spring" and "Inside cover."

If MyST frontmatter includes an OpenAlex `biblio` object, it will be coerced to valid publication metadata.