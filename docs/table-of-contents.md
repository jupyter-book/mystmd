---
title: Table of Contents
description: The Table of Contents is the left-hand navigation for your site, it can be auto-generated or can be explicitly defined in `myst.yml`.
thumbnail: thumbnails/table-of-contents.png
---

+++

The  is the left-hand navigation for your site. It can either be auto-generated, following some simple heuristics described below, or can be explicitly defined in the `toc` attribute of [the project frontmatter](frontmatter.md#in-a-myst-yml-file).

## Generating a Table of Contents

By default the table of contents is left implicit, and follows rules laid out in the next section. To make this table of contents _explicit_, you can call:

```shell
myst init --write-toc
```

This will create (or update) a `toc` entry in `myst.yml`. You can read more about the [table of contents format](#toc-format) below.

+++

## Auto-generating a Table of Contents

When there is no `toc` field defined in your root `myst.yml`, the TOC is defined by the file system structure. All markdown and notebook files will be found in the working directory and all sub-directories. Filenames are not treated as case sensitive, and files are listed before folders. All hidden directories are ignored (e.g. `.git`) and the `_build` directory is also ignored.

The ordering of the table of contents will sort alphabetically as well as order by number, ensuring that, for example, `chapter10` comes after `chapter9`.

### Filename Transformations

The filenames will also be transformed into url-friendly “slugs” that: remove preceding numbers (unless they are year-like, e.g. 1988-02 or 2022); rename any non-url characters (spaces, underscores, etc.) to `-`; lowercase the filename; remove any file extensions (e.g. `.md` or `.ipynb`); and keep the slug less than 50 characters. If there are duplicates, these will be enumerated with a trailing number (e.g. `readme-1`).

- `01-notebook.ipynb` will become `notebook`
- `2021_02_presentation.md` will remain `2021-02-presentation`

### Title Transformations

If a title is not provided by a notebook or markdown document in the front matter or first heading, the filename is used. The filename is transformed to a title by splitting on camel case, replacing `-` or `_` with spaces, and transforming to title-case.

- `01_MyNotebook.ipynb` becomes `My Notebook`
- `my_article.md` becomes `My Article`

### Root Page

The “root” of a site is the page displayed when someone browses to the index of your site without any pathname. The CLI will choose the root file in the following order:

1. `index.md`
2. `README.md`
3. `main.md`
4. The first `.md` file found alphabetically
5. `index.ipynb`
6. `README.ipynb`
7. `main.ipynb`
8. The first `.ipynb` file found alphabetically


### Excluding Files

If there are markdown or notebook files within a project folder that you do not want included in your project, you may list these in the `myst.yml` project frontmatter under `exclude`. For example, to ignore a single file `notes.md`, all notebooks in the folder `hpc/`, and all files named `ignore.md`:

```yaml
project:
  exclude:
    - notes.md
    - hpc/*.ipynb
    - '**/ignore.md'
```

Additionally, files excluded in this way will also not be watched during `myst start`. This may be useful if you have a folder with many thousands of files that causes the `myst start` watch task to crash. For example, in the `data/` directory, there may be no markdown and no notebooks but 100,000 small data files:

```yaml
project:
  exclude: data/**
```

Note that when these files are excluded, they can still be specifically referenced by other files in your project (e.g. in an {myst:directive}`include directives <include>` or as a download), however, a change in those files will not trigger a build. An alternative in this case is to generate a table of contents (see [](./table-of-contents.md)). By default hidden folders (those starting with `.`, like `.git`), `_build` and `node_modules` are excluded.

(toc-format)=

## Defining a Table of Contents

The  MyST TOC comprises of a simple tree structure, built from `file`s, `url`s, `pattern`s, and `children`. For example, a simple TOC consisting of files:
:::{code} yaml
:filename: myst.yml

version: 1
project:
  toc:
    - file: root.md
    - file: first-child.md
    - file: second-child.md
:::
URLs and glob-patterns can also be defined:
:::{code} yaml
:filename: myst.yml

version: 1
project:
  toc:
    - file: root.md
    - pattern: '*-child.md'
    - url: 'https://google.com'
:::
The files matched by `pattern` will be expanded as a series of `file` entries, i.e.:
:::{code} yaml
:filename: myst.yml
:linenos:
:emphasize-lines: 5,6

version: 1
project:
  toc:
    - file: root.md
    - file: first-child.md
    - file: second-child.md
    - url: https://google.com
:::

For larger books, you can group the content using the `children` key, which can be defined for both `url` and `file` entries:
:::{code} yaml
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
:::

It is also possible to group entries together without a root file or URL; an entry comprising only of an array of `children` can be defined _if_ a `title` is also given:
:::{code} yaml
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
:::

## Defining Exported Parts
A MyST document [can be split into several "parts"](document-parts.md#known-frontmatter-parts) that correspond to distinct components. Each TOC entry can be given a `part` key that corresponds to one of these recognized parts, e.g.
:::{code} yaml
:filename: myst.yml

version: 1
project:
  toc:
    - file: root.md
    - file: abstract.md
      part: abstract
    - file: acknowledgements.md
      part: acknowledgements
:::

## Nesting of Files in URLs

MyST can have any level of nesting in a file-system of your project, however, when it is displayed in the URL in `mystmd`, these nesting will be flattened to have a single "slug" that is contained in the project.

- `project/folder2/01_my_article.md` becomes `project/my-article`

All internal links will automatically be updated, and there is a `file` property that is exported as metadata. Add `.json` to the end of any url in your site to see the full data of the page.

:::{note} URL Nesting
URL nesting that matches the folder structure is a requested feature that is being tracked in [#670](https://github.com/executablebooks/mystmd/issues/670).
:::
