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

#### Sort order

You can control the sort order of files matched by a pattern by adding `sort: 'ascending'` or `sort: 'descending'` to the pattern entry. By default, files are sorted in ascending order. The `descending` option is useful for archives where you want the most recent files listed first:

```{code} yaml
:filename: myst.yml
version: 1
project:
  toc:
    - file: root.md
    - pattern: '*.md'
      sort: descending
```

If your files are named with a date at the start, for example, `2025-12-03-reverse-toc.md`, this will list files in reverse alphabetical order (newest first), which is particularly useful for meeting notes, blog posts, or other time-based content.

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

### Document titles

The title of the document in the table of contents is drawn from the
[`title` field](frontmatter#titles) in the
[document frontmatter](frontmatter#in-a-myst-markdown-file) or the first heading
in the document if `title` isn't specified.

**To override the page title in navigation menus** without changing the page's primary title, you have two options:

- The [`short_title`](frontmatter#all-available-frontmatter-fields) field in page frontmatter.
- The `title` field in a Table of Contents entry (this will override `short_title` above if both are set).

For example via page frontmatter:

```yaml
---
title: On the airspeed velocity of an unladen African swallow
short_title: Airspeed Velocity
---
```

Or via `myst.yml`:

```yaml
project:
  toc:
  - file: mypage.md
    title: Acts as short-title
```

These will not change the title in the page itself, or in the document AST, they will only be used in navigation entries and such.

(hidden-in-toc)=

### Hiding pages from the Table of Contents

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

## In-page table of contents

The {myst:directive}`toc` directive displays a list of titles and links for all headers that follow on the page. This can be done at the `project`, `page`, or `section`, level.

There are a few specific examples below and see the {myst:directive}`toc` docs for more information.

### Display headings in a section

Set `:context: section` to list the remaining **Headings** in the current section.
It will detect the parent header where the directive is placed, and list all _child_ headings that come _after_ the location of the directive. For example, note how *this section* header is omitted.

```md
:::{toc}
:context: section
:::
```


:::{toc}
:context: section
:depth: 2
:::

### Display headings on the page

Set `:context: page` to list the **Headings** on the current page.
It will display all headings on the page regardless of where you call `{toc}`.

```md
:::{toc}
:context: page
:::
```

:::{toc}
:context: page
:::

### Display pages in the entire project

Set `:context: project` to list the Table of Contents for the entire project.
It will essentially mirror the structure of `project.toc` and display the page titles across the project. It will not display the headers within each page.

```md
:::{toc}
:context: project
:::
```

::::{dropdown} Click here to see full project TOC
:::{toc}
:context: project
:::
::::

### Control the depth of toc entries

The `:depth:` option will display headers that are nested underneath sections.
For example, to display only the first two layers of headers across the entire project:

```md
:::{toc}
:context: project
:depth: 2
:::
```

::::{dropdown}
:::{toc}
:context: project
:depth: 2
:::
::::

## URL slugs and folder structure

For web-based exports, MyST creates [slugs](https://en.wikipedia.org/wiki/Clean_URL#Slug) to generate clean URLs for your pages, rather than using raw filenames and folder paths.

For example, a page at `folder1/folder2/01_my_article.md` will be reachable at the URL `/my-article`.

Of course, internal links will be generated accordingly, and the `file` property in the [MyST document metadata](website-metadata) will contain the original file path for the page.

### Filenames to slugs

To compute a page's slug, MyST uses the filename and takes these steps:

- Remove preceding numbers (unless they are year-like, e.g., 1988-02 or 2022)
- Change non-URL characters (spaces, underscores, etc.) to dashes (`-`)
- Convert to lowercase
- Remove file extensions (e.g., `.md` or `.ipynb`)
- Limit to 50 characters

See [some slug examples below](#toc-slugs).

If there are duplicates, these will be enumerated with a trailing number (e.g. `readme-1`).

### Preserve folders in URLs

By default, MyST will _remove folder information_ when creating URLs.
To make your URL match your folder structure (so that `myfolder/myfile.md` becomes `myfolder/myfile/`), see [](#site-url-folders).

(implicit-toc)=

## Implicit Table of Contents from filenames

When there is no `toc` field defined in your root `myst.yml`, the TOC is defined by the file system structure. All Markdown and notebook files will be found in the working directory and all sub-directories. Filenames are not treated as case sensitive, and files are listed before folders. All hidden directories are ignored (e.g. `.git`) and the `_build` directory is also ignored.

The ordering of the table of contents will sort alphabetically as well as order by number, ensuring that, for example, `chapter10` comes after `chapter9`.

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

### Default Titles

If a title is not provided by a notebook or Markdown document in the front matter or first heading, the filename is used. The filename is transformed to a title by splitting on camel case, replacing `-` or `_` with spaces, and transforming to title-case.

- `01_MyNotebook.ipynb` becomes `My Notebook`
- `my_article.md` becomes `My Article`

(toc-format-legacy)=

## Compatibility with Jupyter Book v1

:::{warning}
Support for `_toc.yml` exists only for compatibility reasons, and **will be removed in the future**.
New users should use `myst.yml` instead.
:::

Jupyter Book v2 uses the MyST engine, but Jupyter Book v1 uses a different configuration structure that is designed for Sphinx. However, you can currently use a Jupyter Book v1 Table of Contents file (`_toc.yml`) with MyST.The documentation for this format is fully described in [Jupyter Book](https://jupyterbook.org/en/stable/structure/toc.html).
::::

## Configure your Table of Contents in a separate file using `extend:`

If your Table of Contents is very long, it can make your `myst.yml` difficult to read and maintain. You can use [`extends:` functionality](#composing-myst-yml) to store the ToC structure in a separate file, allowing you to re-use it in a modular way. 

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

