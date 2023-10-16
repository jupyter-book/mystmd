---
title: Plugins
description: Plugins provide powerful ways to extend and customize MyST
---

Plugins provide powerful ways to extend and customize MyST by adding directives and roles or specific transformations on the AST that can download or augment your articles and documentation. These plugins also support custom rendering and transformation pipelines for various export targets including React, HTML, LaTeX, and Microsoft Word.

:::{danger} Plugins are incomplete and in Beta
The interfaces and packaging for the plugins may change substantially in the future.\
**Expect changes!!**

If you are implementing a plugin, please let us know on [GitHub](https://github.com/executablebooks/mystmd) or [Discord](https://discord.mystmd.org/).
:::

## Overview of a Plugin

Plugins are executable javascript code that can modify a document source. The supported plugin types are:

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

## Creating a Plugin

To create a plugin, you will need a single Javascript file[^esm] that exports one or more of the objects above. For example, a simple directive that pulls a random image from [Unsplash](https://unsplash.com/) can be created with a single file that exports an `unsplash` directive.

[^esm]: The format of the Javascript should be an ECMAScript modules, not CommonJS. This means it uses `import` statements rather than `require()` and is the most modern style of Javascript.

:::{literalinclude} unsplash.mjs
:caption: A plugin to add an `unsplash` directive that includes a beautiful, random picture based on a query string.
:::

This code should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - unsplash.mjs
```

Then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 Unsplash Images (unsplash.mjs) loaded: 1 directive
...
```

You can now use the directive, for example:

```markdown
:::{unsplash} misty,mountains
:::
```

:::{unsplash} misty,mountains
:size: 600x250
:::

If you change the source code you will have to stop and re-start the server to see the results.

The types are defined in `myst-common` ([npm](https://www.npmjs.com/package/myst-common), [github](https://github.com/executablebooks/mystmd/tree/main/packages/myst-common)) with the [`DirectiveSpec`](https://github.com/executablebooks/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L68-L77) and [`RoleSpec`](https://github.com/executablebooks/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L79-L85) being the main types to implement.
