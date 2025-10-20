---
title: Table of Contents
description: The Table of Contents is the left-hand navigation for your site, it can be auto-generated or can be explicitly defined in `myst.yml`.
thumbnail: thumbnails/table-of-contents.png
---

The Table of Contents defines the structure of your MyST project.
It is defined in the `toc` attribute of [the project frontmatter](frontmatter.md#in-a-myst-yml-file).

To automatically add a `toc` section to your `myst.yml` file using filenames to define ordering, use the following command:

```shell
myst init --write-toc
```

:::{seealso} Website exports
For website exports, the Table of Contents defines the left-hand navigation for your site.
See [](./website-navigation.md) for more information.
:::

+++

(toc-format)=

## Structure the Table of Contents

The MyST TOC comprises a simple tree structure, built from `file`s, `url`s, `pattern`s, and `children`. For example, a simple TOC consisting of files:

```{code} yaml
:filename: myst.yml

version: 1
project:
  toc:
    - file: root.md
    - file: first-child.md
    - file: second-child.md
```

### URL entries

URLs can be defined in the TOC. These URLs are links to external references within your table of contents. URLs are ignored in non-web exports.

```{code} yaml
:filename: myst.yml

version: 1
project:
  toc:
    - file: root.md
    - url: 'https://google.com'
      title: Google
```

By default, URLs open in a new tab. You can change that with the
`open_in_same_tab` option:

```{code} yaml
- url: 'https://google.com'
  title: Google
  open_in_same_tab: true
```

### Glob pattern matching

You can specify glob-like patterns in the TOC with the `pattern` key.
The files matched by `pattern` will be expanded using similar logic to the [implicit table of contents](#implicit-toc):

- Folder structure is maintained
- [Project exclude](#project-exclude) files are respected
- Index/readme files are sorted to come first
- Files that are listed explicitly in the TOC will be ignored by the pattern

For example, with a folder with `root.md`, `child9.md`, `child10.md`, the following two `toc` entries are equivalent:

:::::{grid} 1 2 2 2
::::{card} Pattern-matching

```{code} yaml
:filename: myst.yml
version: 1
project:
  toc:
    - file: root.md
    - pattern: '*.md'
```

::::
::::{card} No pattern-matching

```{code} yaml
:filename: myst.yml
:linenos:
:emphasize-lines: 5,6
version: 1
project:
  toc:
    - file: root.md
    - file: child9.md
    - file: child10.md
```

::::
:::::

### Nesting pages and dropdowns

For larger projects, you can group the content using the `children` key, which can be defined for both `url` and `file` entries:

```{code} yaml
:filename: myst.yml
version: 1
project:
  toc:
    - file: root.md
    - file: part-1.md
      children:
        - file: part-1-first-child.md
        - file: part-1-second-child.md
    - file: part-2.md
      children:
        - file: part-2-first-child.md
        - file: part-2-second-child.md
```


You can nest children under a `title` without specifying a parent `file`.
This will create a dropdown of pages in the Table of Contents.

```{code} yaml
:filename: myst.yml
version: 1
project:
  toc:
    - file: root.md
    - title: Part 1
      children:
        - file: part-1-first-child.md
        - file: part-1-second-child.md
    - title: Part 2
      children:
        - file: part-2-first-child.md
        - file: part-2-second-child.md
```

:::{note} Landing page title
The landing page inherits its TOC title from `title` field of [the project formatter](frontmatter.md#available-frontmatter-fields), if it is defined.
Otherwise it will be the title or the top heading of the page.
:::

(hidden-in-toc)=

## Hiding pages from the Table of Contents

In some cases, you may want some pages in your project to be built, but not included in the Table of Contents. You can do this by adding a `hidden: true` attribute to the corresponding `file` or `pattern` entry in your `toc` section:

```{code} yaml
:filename: myst.yml
version: 1
project:
  toc:
    - file: accessible-from-the-toc.md
    - file: built-but-not-mentioned-in-the-toc.md
      hidden: true
```

In particular: hidden pages do not impact numbering; also they can be referred to by other pages in the project.

(implicit-toc)=

## Implicit Table of Contents from filenames

When there is no `toc` field defined in your root `myst.yml`, the TOC is defined by the file system structure. All Markdown and notebook files will be found in the working directory and all sub-directories. Filenames are not treated as case sensitive, and files are listed before folders. All hidden directories are ignored (e.g. `.git`) and the `_build` directory is also ignored.

The ordering of the table of contents will sort alphabetically as well as order by number, ensuring that, for example, `chapter10` comes after `chapter9`.

### Filename Transformations

The filenames will also be transformed into url-friendly “slugs” that: remove preceding numbers (unless they are year-like, e.g. 1988-02 or 2022); rename any non-url characters (spaces, underscores, etc.) to `-`; lowercase the filename; remove any file extensions (e.g. `.md` or `.ipynb`); and keep the slug less than 50 characters. If there are duplicates, these will be enumerated with a trailing number (e.g. `readme-1`).

- `01-notebook.ipynb` will become `notebook`
- `2021_02_presentation.md` will remain `2021-02-presentation`

### Title Transformations

If a title is not provided by a notebook or Markdown document in the front matter or first heading, the filename is used. The filename is transformed to a title by splitting on camel case, replacing `-` or `_` with spaces, and transforming to title-case.

- `01_MyNotebook.ipynb` becomes `My Notebook`
- `my_article.md` becomes `My Article`

### Root Page

The “root” of a site is the page displayed when someone browses to the index of your site without any pathname. The CLI will choose the root file in the following order:

1. `index.md` / `README.md` / `main.md`
2. `index.tex` / `README.tex` / `main.tex`
3. `index.ipynb` / `README.ipynb` / `main.ipynb`
4. The first `.md` file found alphabetically
5. The first `.tex` file found alphabetically
6. The first `.ipynb` file found alphabetically

(project-exclude)=

### Excluding Files

If there are Markdown or notebook files within a project folder that you do not want included in your project, you may list these in the `myst.yml` project frontmatter under `exclude`. For example, to ignore a single file `notes.md`, all notebooks in the folder `hpc/`, and all files named `ignore.md`:

```yaml
project:
  exclude:
    - notes.md
    - hpc/*.ipynb
    - '**/ignore.md'
```

Additionally, files excluded in this way will also not be watched during `myst start`. This may be useful if you have a folder with many thousands of files that causes the `myst start` watch task to crash. For example, in the `data/` directory, there may be no Markdown and no notebooks but 100,000 small data files:

```yaml
project:
  exclude: data/**
```

Note that when these files are excluded, they can still be specifically referenced by other files in your project (e.g. in an {myst:directive}`include directives <include>` or as a download), however, a change in those files will not trigger a build. An alternative in this case is to generate a table of contents (see [](./table-of-contents.md)). By default hidden folders (those starting with `.`, like `.git`), `_build` and `node_modules` are excluded.

## Folder structure and URL slugs

By default, MyST will _flatten folder structure_ when creating URLs.
If a file is nested under a folder within your MyST project, for web-based exports its URL will be flattened to have a "slug" that removes folder information.
For example, a folder structure like:

- `folder1/folder2/my-article.md`

Produces this URL path:

- `/my-article`

Internal links will automatically be updated (duplicate filenames will have numbers appended, like `myfile-1`), and the `file` property in the [MyST document metadata](./website-metadata.md) will contain the original file path for the page.

### Make your URL match your folder structure

To make your URL match your folder structure (so that `myfolder/myfile.md` becomes `myfolder/myfile/`), set `site.options.folders` to `true` in `myst.yml`. For example:

```{code} yml
:filename: myst.yml
:caption: Example of setting folders to true to show nested file structure in the URL
:linenos:
:lineno-start: 78
:emphasize-lines: 82
...
site:
  template: book-theme
  options:
    folders: true
...
```

This will make a file like `folder1/folder2/01_my_article.md` render as the following URL slog: `/folder1/folder2/my-article`.

::::{note} Compatibility with Jupyter Book
:class: dropdown

(toc-format-legacy)=

## Defining a `_toc.yml` using Jupyter Book v1 format

:::{warning}
Support for `_toc.yml` exists only for compatibility reasons, and will be removed in future.
New users should use `myst.yml` instead.
:::

Jupyter Book v2 uses the MyST engine, but Jupyter Book v1 uses a different configuration structure that is designed for Sphinx. However, you can currently use a Jupyter Book v1 Table of Contents file (`_toc.yml`) with MyST.The documentation for this format is fully described in [Jupyter Book](https://jupyterbook.org/en/stable/structure/toc.html).
::::

## Using extend for a long ToC
In some cases the ToC becomes very long, where it would be more convenient to create a separate ToC file. This can be done using [extends](#composing-myst-yml). 

```{code-block} yaml
:filename: myst.yml
---
version: 1
project:
  [..]

extends:
  - toc.yml

site:
  [..]
---
```

```{code-block} yaml
:filename: toc.yml
---
version: 1
project:
  toc:
    - file: index.md
    - title: Some title 
      children:
        - file: introduction/about.md
        - file: introduction/credits.md
---  
```

