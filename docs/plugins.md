---
title: Plugins
description: Plugins provide powerful ways to extend and customize MyST
---

Plugins allow you to extend and customize MyST to augment your articles and documentation. They also support custom rendering and transformation pipelines for various export targets including React, HTML, LaTeX, and Microsoft Word.

:::{danger} Plugins are in-progress
The interfaces and packaging for the plugins may change substantially in the future.\
**Expect changes!!**

If you are implementing a plugin, please let us know on [GitHub](https://github.com/jupyter-book/mystmd) or [Discord](https://discord.mystmd.org/).
:::

## Overview of a Plugin

Plugins are executable code that can modify {term}`MyST AST` as part of a build process. The supported plugin types are:

directives
: Add or overwrite directives, which provide a "block-level" extension point.
: For example, create a `:::{proof}` extension that allows for numbered proofs.

roles
: Add or overwrite roles, which provide an inline extension point.
: For example, create a role for showing units, `` {si}`4 kg per meter squared` ``.

transforms
: These plugins transform the document source while it is rendered.
: For example, add metadata or transform a link to a DOI.

:::{warning} Planned - Not Yet Implemented
:class: dropdown

renderers
: These plugins add handlers for various nodes when exporting to a specific format.
: For example, do something special for node in HTML, React, Microsoft Word, or LaTeX.
:::

## Write a Plugin

There are two ways to implement a plugin in MyST:

1. [JavaScript plugins](./javascript-plugins.md) are written in MyST's native language. They are the easiest way to write and share plugins if you have some familiarity with JavaScript.
2. [Language-agnostic executable plugins](./executable-plugins.md) allow you to write plugins in any language that can be executed. They are a better choice if you are unfamiliar with JavaScript, but are confident in a non-JS language (e.g. Python).

## Package and distribute plugins

You can build plugins and share them with others for re-use as JavaScript modules.
See [](./plugins-distribute.md).

(plugins:use)=
## Use plugins in your MyST project

To use a plugin in your MyST project, use the `project.plugins` list in your `myst.yml` configuration. You can link **plugins on local filesystem** or **remote plugins accessible by URL**. Here's an example of each:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    # Example of a local plugin
    - local/folder/picsum.mjs
    # Example of a hosted artifact on github
    - https://github.com/my-org/plugin-repo/releases/download/latest/myplugin.mjs
```
