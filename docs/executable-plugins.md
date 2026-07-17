---
title: Write plugins in other languages
description: Plugins built as stand-alone applications can be written in languages such as Python, and may be more familiar to some developers.
---

MyST is able to invoke plugins written in different languages through standard IO protocols, for example, in Python. These are called **Executable Plugins** because they rely on scripts that are executed at build time.

(executable-plugins)=
## How executable plugins work

Executable Plugins use `STDIO` to allow plugins that are written in any language, so long as they can access `STDIO` and can be executed. You configure an executable plugin in `myst.yml` like so:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: executable
      path: picsum.py
```

Your Executable Plugin file should have a `PLUGIN_SPEC` variable that defines its name and any roles, directives, or transforms that it will use. [See this `PLUGIN_SPEC` for example](https://github.com/projectpythia-mystmd/cookbook-gallery/blob/5ffd06e15d0058f310ea52f84f79f4f1d5394f81/pythia-gallery.py#L123-L127).

Your Executable Plugin should be executable from the command line, and take the arguments `--role`, `--directive`, and `--transform`. These will be used by MyST. [Here's an example in Python](https://github.com/projectpythia-mystmd/cookbook-gallery/blob/5ffd06e15d0058f310ea52f84f79f4f1d5394f81/pythia-gallery.py#L133-L135).

When your MyST site is built, MyST will **execute** the file specified in `path:` and follows a process like the following:

- **Read in the MyST AST from STDIN**. Parse it as JSON. [Here's an example](https://github.com/projectpythia-mystmd/cookbook-gallery/blob/5ffd06e15d0058f310ea52f84f79f4f1d5394f81/pythia-gallery.py#L139)
- **Modify the JSON AST in your script**. You can make edits, add things, etc. Just make sure that it remains valid JSON, and that it continues to follow the {term}`MyST Specification`. [Here's an example of the kind of AST you could output](https://github.com/projectpythia-mystmd/cookbook-gallery/blob/5ffd06e15d0058f310ea52f84f79f4f1d5394f81/pythia-gallery.py#L57-L79).
- **Print the new MyST AST to STDOUT**. `mystmd` will read from STDOUT and insert the node at the proper location. [Here's an example](https://github.com/projectpythia-mystmd/cookbook-gallery/blob/5ffd06e15d0058f310ea52f84f79f4f1d5394f81/pythia-gallery.py#L140).

:::{warning} What happens in an Executable Plugin is a black box
Executable MyST plugins are treated as a [](wiki:black_box), whereby MyST only sees the data it passes to the plugin, and the response from the plugin itself.
:::

## Define a new directive

:::{note}
There are many different ways to create an executable plugin. Here we'll use Python to implement an `picsum-py` directive, but any programming language that can read and write from stdin, stdout, and stderr, and define a command line interface would work.
:::

First, we'll declare the plugin _specification_ that allows MyST to discover the directives, transforms, and/or roles that the plugin implements. This specification looks very similar to [the definition of a JavaScript plugin](javascript-plugins.md#picsum-js-source), except the implementation logic (e.g. the directive `run` method) is not defined.

:::{literalinclude} picsum.py
:caption: A plugin to add an `picsum-py` directive that includes a beautiful, random picture based on a size and optional ID string.
:::
this file should be executable, e.g.

```{code} shell
chmod +x ./picsum.py
```

and should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: executable
      path: picsum.py
```

then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 Lorem Picsum Images (picsum.py) loaded: 1 directive
...
```

you can now use the directive, for example:

```markdown
:::{picsum-py}
:size: 600x250
:::
```

:::{picsum-py}
:size: 600x250
:::

If you change the source code you will have to stop and re-start the server to see the results.

The types are defined in `myst-common` ([npm](https://www.npmjs.com/package/myst-common), [github](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-common)) with the [`DirectiveSpec`](https://github.com/jupyter-book/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L68-L77) and [`RoleSpec`](https://github.com/jupyter-book/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L79-L85) being the main types to implement.

## Implementing a custom transform

Directives can be used to extend MyST with rich structured content. However, sometimes we want to _modify_ the existing behavior of MyST. One of the ways to do this is by writing a custom transform. In this section, we'll implement a transform that replaces **bold** text with **special bold text**.

First, let's define the transform
:::{literalinclude} markup.py
:caption: A plugin to add a transform that replaces strong nodes with emphasis nodes.
:::
this code should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: executable
      path: markup.py
```

then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 Strong to emphasis (markup.py) loaded: 1 directive
...
```

you can now use the directive, for example:

```markdown
I am **special bold text (python)**, whilst I am **normal bold text**
```

I am **special bold text (python)**, whilst I am **normal bold text**
