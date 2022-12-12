---
title: MyST CLI Reference
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

`myst build` is used to export pdf, tex, and docx artifacts from MyST files, as well as build MyST websites containing all content from MyST project(s).

From within a [project](#myst-init) you may run this command with no arguments and it will peform all exports defined in the frontmatter of project files, as well as build the content for a site, if a `site` config is defined:

```
myst build
```

You may specifiy `--pdf`, `--tex`, and/or `--docx` to only export those types of static files:

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

You may specifiy `--site` if you only wish to build the site content. The first time you build the site, this command will also download the site template to a local build directory:

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

You may also specify `--templates`, `--site`, `--temp`, and `--exports` options to only delete the corresponding folders in the `_build` directory:

```
myst clean --templates
```

There is an `--all` option to delete all files created by MyST. The only difference between invoking the command with this flag and without is `--templates` will be included:

```
myst clean --all
```
