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

`myst build` is used to export pdf, tex, and docx artifacts from MyST files.

From within a [project](#myst-init) you may run this command with no arguments and it will peform all exports defined in the frontmatter of project files:

```
myst build
```

You may specifiy `--pdf`, `--tex`, and/or `--docx` to only export those types:

```
myst build --pdf
```

You may also specify individual files to export:

```
myst build index.md reference.md
```

To perform exports without defining export frontmatter in the files, you may use the `--force` option. If you use this option, you must also specify the desired format(s):

```
myst build --force --pdf
```

## MyST Clean

`myst clean` is used to clean up temp files and built artifacts. By default it only cleans the files that would be created by the equivalent `myst build` command. For example to clean all exports defined in the frontmatter of project files:

```
myst clean
```

To clean all PDFs built from `index.md`:

```
myst clean --pdf index.md
```

You may also specify `--temp` and `--exports` options to delete the corresponding folders in the `_build` directory, in addition to deleting any other build artifacts:

```
myst clean --temp --exports
```
