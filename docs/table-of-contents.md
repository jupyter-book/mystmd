---
title: Table of Contents
description: The Table of Contents is the left-hand navigation for your site, it can be auto-generated or can be explicitly defined in a _toc.yml.
thumbnail: thumbnails/table-of-contents.png
---

+++

The Table of Contents is the left-hand navigation for your site. It can either be auto-generated, following some simple heuristics described below, or can be explicitly defined in a `_toc.yml` using the `jb-book` format.

## Generating a Table of Contents

By default the table of contents is left implicit, and follows rules laid out in the next section. To make this table of contents _explicit_, you can call:

```shell
myst build --write-toc
```

This will create a `_toc.yml` in the current directory, you can read more about the [table of contents format](#toc-format) below.

+++

## Auto-generating a Table of Contents

When there is no `_toc.yml` defined an implicit table of contents is defined by the file system structure. All markdown and notebook files will be found in the working directory and all sub-directories. Filenames are not treated as case sensitive, and files are listed before folders. All hidden directories are ignored (e.g. `.git`) and the `_build` directory is also ignored.

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

```{note}
All of these can be over-ridden by choosing an explicit `_toc.yml`, when that is present it will be used.
```

(toc-format)=

## Defining a `_toc.yml` using Jupyter Book’s format

The `_toc.yml` can be defined for a site, and uses the format describe by Jupyter Book, the documentation for the format is fully described in [Jupyter Book](https://jupyterbook.org/en/stable/structure/toc.html). Briefly, it defines a `format` as `jb-book` and can list a number of `chapters` with files. The file paths are relative to your `_toc.yml` file and can optionally include the extension.

```yaml
format: jb-book
root: index
chapters:
  - file: path/to/chapter1
  - file: path/to/chapter2
```

For larger books, you can group the content into `parts`. Each `part` has a `caption` and a list of `chapters` files can define children using a list of `sections`.

```yaml
format: jb-book
root: index
parts:
  - caption: Name of Part 1
    chapters:
      - file: path/to/part1/chapter1
      - file: path/to/part1/chapter2
        sections:
          - file: path/to/part1/chapter2/section1
  - caption: Name of Part 2
    chapters:
      - file: path/to/part2/chapter1
      - file: path/to/part2/chapter2
```

+++

## Nesting of Files in URLs

You can have any level of nesting in a file-system of your project, however, when it is displayed in the URL in `mystjs`, these nesting will be flattened to have a single “slug” that is contained in the project.

- `project/folder2/01_my_article.md` becomes `project/my-article`

All internal links will automatically be updated, and there is a `file` property that is exported as metadata. Add `.json` to the end of any url in your site to see the full data of the page.

If you want to have URL nesting, we suggest splitting your site up into different "projects", which are simply other `myst.yml` definitions and can all exist in a single Git repository, for example. Each project has its own metadata, and can for example define GitHub links, or any other [](./frontmatter.md) that will cascade to the various documents in that project.
