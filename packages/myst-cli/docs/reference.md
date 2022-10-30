---
title: MyST CLI Reference
---
(myst-init)=
## MyST Init

`myst init` initializes a MyST project in the current folder by writing an empty `myst.yml` file.

```
myst init
```

You may also write a table of contents file based on markdown/jupyter notebook files found on the path.

```
myst init --writeToc
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
