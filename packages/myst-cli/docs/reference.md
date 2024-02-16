---
title: MyST Markdown CLI Reference
---

(myst-init)=

## MyST Init

MyST projects and MyST sites are defined by a `myst.yml` config file. In this file, you may have one or both of:

- "project" config, which contains project frontmatter (the structure of the project may be implicit based on folder structure or explicit if a separate table of contents `_toc.yml` file is present)
- "site" config, which includes references to MyST project(s), navigational information for how the projects compose the site, and a template for building the site itself.

`myst init` initializes a MyST config file `myst.yml` in the current folder. By default, this file contains both a simple `project` config and `site` config which may be subsequently edited to add frontmatter, update structure, etc.

By invoking this command, you are saying: "I want the content of my folder to become a single MyST project, _and_ I want to create a website with that content."

```
myst init
```

You may also specify `--project` or `--site` to only initialize the respective configs.

With only a `project` config, you may update frontmatter for all content in the project and you may reference this project from existing sites elsewhere:

```
myst init --project
```

With only a `site` config, you may build the structure of your site manually, referencing existing projects in other directories:

```
myst init --site
```

You may also write a table of contents file based on markdown/jupyter notebook files found on the path. This creates a `_toc.yml` file which can be manually edited so the structure of your project/site may diverge from your local folder structure:

```
myst init --write-toc
```

## MyST Build

`myst build` is used to export pdf, tex, docx, and JATS xml artifacts from MyST files, as well as build MyST websites containing all content from MyST project(s).

From within a [project](#myst-init) you may run this command with no arguments and it will perform all exports defined in the frontmatter of project files, as well as build the content for a site, if a `site` config is defined:

```
myst build
```

You may specify `--pdf`, `--tex`, `--docx`, and/or `--xml` to only export those types of static files:

```
myst build --pdf
```

You may also specify individual files to export; these files still must define exports in their frontmatter:

```
myst build index.md reference.md
```

To perform exports without defining export frontmatter in the files, you may use the `--force` option. If you use this option, you must also specify the desired format(s):

```
myst build --force --pdf
```

You may specify `--site` if you only wish to build the site content. The first time you build the site, this command will also download the site template to a local build directory:

```
myst build --site
```

MyST can check for broken links when building a site. To report bad links:

```
myst build --check-links
```

And to fail the build if there are bad links:

```
myst build --strict
```

If a link successfully resolves during `--check-links`, the status will be cached to disk and the link will not be rechecked. If you need to recheck for broken links, you may clear this cache with `myst clean --cache`.

## MyST Start

`myst start` starts a local web server for your MyST site.

```
myst start
```

To serve only the MyST data and not the template server:

```
myst start --headless
```

To serve the site on a host other than `localhost`, set up a `HOST` environment variable then use the `--keep-host` option:

```
myst start --keep-host
```

## MyST Clean

`myst clean` is used to clean up temp files and built artifacts. By default it cleans (1) all static file exports, (2) built site content, and (3) temp data. This command will prompt before it deletes anything:

```
myst clean
```

You may also specify specific file types or source files. For example, to clean all PDFs built from `index.md`:

```
myst clean --pdf index.md
```

You may also specify `--templates`, `--logs`, `--cache`, `--site`, `--temp`, and `--exports` options to only delete the corresponding folders in the `_build` directory:

```
myst clean --templates
```

There is an `--all` option to delete all files created by MyST. The only difference between invoking the command with this flag and without is `--templates` will be included:

```
myst clean --all
```

## MyST Templates

### `myst templates list`

List all known public templates.

You may specify `--site`, `--tex`, and/or `--docx` to only export those types of static files:

```bash
myst templates list
> EarthArXiv (Two Column)  eartharxiv_two_column
>     Description: A two column preprint template for EarthArXiv with the AGU bibstyle
>     Tags: paper, two-column, geoscience, earthscience, preprint
>
> arXiv (Two Column)       arxiv_two_column
>     Description: A two column arXiv compatible template
>     Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv
```

You can also filter by `--tag two-column` or any comma separated tags that will be used to filter the list.

### `myst templates list [template]`

To find the details on a single template use:

```bash
myst templates list volcanica --tex
> Volcanica                volcanica
> ID: public/volcanica
> Version: 1.0.0
> Author: Volcanica
> Description: A template for submissions to the Volcanica journal
> Tags: paper, journal, two-column, geoscience, earthscience
```
