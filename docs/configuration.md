---
title: Configuration and content frontmatter
description: Frontmatter can be set at the top of your documents and in myst.yml to change the look and feel of your content.
thumbnail: thumbnails/frontmatter.png
---

Frontmatter allows you to specify metadata and options about how your project should behave or render.
Included in frontmatter are things like the document or project `title`, what `thumbnail` to use for site or content previews, `authors` that contributed to the work, and scientific identifiers like a `doi`.
Adding frontmatter ensures that these properties are available to downstream tools or build processes like building [](./creating-pdf-documents.md).

## Where to set frontmatter

Frontmatter can be set in two places:

1. The YAML header of a markdown (`md`) or notebook (`ipynb`) file (described as a "page" below)
2. In `myst.yml` file. This will be applied to all content in that project (apart from "page only" fields).

See [](#field-behavior) below about how these two sources of settings interact

## Page-level frontmatter

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

::::{note} Using `jupytext` or a Markdown-based notebook?

If your Jupyter Notebook is described as a markdown file (e.g. using [jupytext](https://jupytext.readthedocs.io/en/latest/formats-markdown.html), or [MyST](https://jupyterbook.org/en/stable/file-types/myst-notebooks.html)), then this should be included in the frontmatter section, as shown in the examples below.

:::{tip} a Jupytext (md:markdown) example
:class: dropdown

````markdown
---
jupyter:
  jupytext:
    text_representation:
      extension: .md
      format_name: markdown
  kernelspec:
    display_name: Python 3 (ipykernel)
    language: python
    name: python3
  language_info:
    name: python
    nbconvert_exporter: python
    pygments_lexer: ipython3
  short_title: images
  title: images and figures
---

You don't need a level-1 title,
it is defined in the frontmatter above already

```{code-cell} ipython3
import numpy as np
```
````
:::

:::{tip} a Jupytext (md:myst) example
:class: dropdown

````markdown
---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
kernelspec:
  display_name: Python 3 (ipykernel)
  language: python
  name: python3
language_info:
  name: python
  nbconvert_exporter: python
  pygments_lexer: ipython3
title: images and figures
short_title: images
---

You don't need a level-1 title,
it is defined in the frontmatter above already

```{code-cell} ipython3
import numpy as np
```
````
:::

::::

## Project-level frontmatter

### In a `myst.yml` file

Frontmatter fields can be added directly to any `project:` section within a `myst.yml` file. These will be applied to all pages in your MyST project. Here's an example:

```yaml
version: 1
site: ...
project:
  license: CC-BY-4.0
  open_access: true
```

(field-behavior)=

## How project and page frontmatter interact

Frontmatter can be attached to a "page", meaning a local `.md` or `.ipynb` or a "project". However, some frontmatter fields are available across an entire project, while others are only available for a given page.

The behavior of each frontmatter field is hard-coded within MyST. These are the kinds of scope that a frontmatter field can have:

`page & project`
: the field is available on both the page & project but they are independent

`page only`
: the field is only available on pages, and not present on projects and it will be ignored if set there.

`page can override project`
: the field is available on both page & project but the value of the field on the page will override any set of the project. If the page field is omitted or undefined, the project value will be used. If the page field has a value of `null` (or `[]` in the case of multi-item fields like `authors`), the page will override the project value and clear the field for that page.

`project only`
: the field is only available on projects, and not present on pages and it will be ignored if set there.

+++

(composing-myst-yml)=

## Compose and extend configuration `.yml` files

You may separate your frontmatter into multiple, composable files. This allows you to have a single source of truth for frontmatter to re-use across multiple projects, for example math macros or funding information.

To reference other files from your main `myst.yml` file, use the `extends` key with relative path(s) to the other configuration files:

```yaml
version: 1
site: ...
project: ...
extends:
  - ../macros.yml # A local file
  - https://raw.githubusercontent.com/myorg/myrepo/refs/heads/main/funding.yaml # A remote file
```

Each entry listed inside `extends` may be a relative path to a file, or a URL. URLs must be direct links to files which are downloaded and cached locally. The files must contain valid `myst.yml` structure with `version: 1` and `site` or `project` keys. They may also have additional entries listed under `extends`.

When using `extends` to compose configuration files, list-type fields are combined, rather than replaced. This means, for example, you may define a single export in one file:

```yaml
version: 1
project:
  export:
    format: meca
```

Then, any `myst.yml` file that extends this file will have a `meca` export in addition to any other exports it defines. This behavior applies to the list fields: `tags`, `keywords`, `exports`, `downloads`, `funding`, `resources`, `requirements`, `bibliography`, `editors`, and `reviewers`. The fields `exports` and `downloads` are deduplicated by `id`, so if you wish to override a value from an inherited configuration you may assign it the same `id`. Other fields cannot be overridden; instead, shared configurations should be as granular and shareable as possible.

+++