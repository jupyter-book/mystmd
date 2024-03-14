---
title: Add a New MyST Feature
short_title: Add a Feature
--- 

In this guide, we will walk through the process of adding a new word-counter role `{word-count}` to MyST. Although it is possible to [write a plugin](plugins.md) to extend and customize MyST, this guide covers the steps required to implement this feature as a core feature of MyST. We will start from the very beginning of cloning the MyST repository, and finish with a working `word-count` feature!

## Cloning the Repository
The rest of this guide will assume that you have basic knowledge of using Git, and running commands in a terminal/console on one of the major operating systems. Although this guide can be used to author a new MyST feature on any (supported) operating system, we will assume that you are using a typical Linux distribution for simplicity.

:::{tip}
:class: dropdown

If you have not used Git before, the [Git Book](https://git-scm.com/book/) is a _comprehensive_ guide to the tool. Whilst it is recommended to develop a good understanding of Git, if you're short on time, Roger Dudler's [Git Guide](https://rogerdudler.github.io/git-guide/) describes itself as 
> just a simple guide for getting started with git. no deep shit ;)

which should cover enough to get you started. Before doing anything, though, you will need to install Git, which [is described in the Git Guide](https://rogerdudler.github.io/git-guide/#setup). 
:::

First, let's clone the current state of the [the `mystmd` repository](https://github.com/executablebooks/mystmd).

```bash
git clone https://github.com/executablebooks/mystmd
```

This will populate a new `mystmd` directory in the working directory with the current (development) checkout (state) of the MyST repository. This checkout may include new features that have yet to be released to the public, or new bugs that have yet to be identified! We will modify these sources to add a new role and its associated transformation logic.

Before moving on to the next step, let's change to the `mystmd` directory
```bash
cd mystmd
```


## Defining a Role
The core specification for MyST as a markup language is defined in [the MyST spec](https://mystmd.org/spec). Most features in MyST should, over time, be incorporated into this specification so that consumers of MyST documents (such as `myst-parser` from the Jupyter Book software stack) can agree on the manner in which MyST documents should be parsed and rendered. Despite its importance, we can ignore exploring the process of updating the specification for this guide.

What is a role? The spec [defines roles](https://mystmd.org/spec/overview#roles) as 
> similar to directives, but they are written entirely in one line.

We want to create a new `word-count` role that injects the total word count into a document. It should accept a format-string that allows us to format the resulting text, i.e.
```markdown
This is a lengthy document ...

{word-count}`The number of words in this document is {number} words`
```

Some of the "core" roles in `mystmd` are implemented in the [`myst-roles` package](https://github.com/executablebooks/mystmd/tree/main/packages/myst-roles). Although a word-count role might not be considered a "core" feature, we will pretend it is for this tutorial. Let's start by looking at the existing `abbreviation` role in [`packages/myst-roles/src/abbreviation.ts`](https://github.com/executablebooks/mystmd/blob/main/packages/myst-roles/src/abbreviation.ts)

:::{tip}
You can hover your mouse cursor over the link to [`packages/myst-roles/src/abbreviation.ts`](https://github.com/executablebooks/mystmd/blob/main/packages/myst-roles/src/abbreviation.ts) to see the contents of the file.
:::

We can see that `abbrevationRole` is annotated with the type `RoleSpec`. This is the basic type of a role declaration defined by the MyST specification. There are a number of important fields, such as the `name`, `alias`, and `body`. Our role will have the name `word-count`, and knowing that, we can define a barebones implementation that doesn't do anything! Let's add a new source file[^src] `word-count.ts` in the `myst-roles` package, and write the following:
```typescript
import type { RoleSpec, RoleData, GenericNode } from `myst-common`;

export const wordCountRole: RoleSpec = {
  name: 'word-count',
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    // TODO!
    return [];
  }
};
```

In order to determine what should our `run` function should do, we must understand how MyST documents are built. MyST generates a website or article from a MyST Markdown file in roughly three phases, shown in the diagram below.
:::{mermaid}

graph LR;
parse[Parse Markdown into AST]
transform[Transform AST into New ASTs]
export[Export AST to Website/Article]

parse --> transform --> export
:::
At the heart of MyST is the AST, which is a structured representation of a document. The MyST AST is defined by the [MyST Specification](https://spec.mystmd.org/). Whilst directives, roles, and fragments of Markdown syntax are individually processed to build this AST, transforms are performed on the entire AST, i.e. over the entire document. As computing the word-count requires access to the entire document, it is clear that all of the logic of our new feature will need to be implemented as a transform. Therefore, our role definition can be very simple - generating a simple AST node that our yet-unwritten transform can later replace:

:::{code-block} typescript
:linenos:
:emphasize-lines: 10,11,12,13,14,15

import type { RoleSpec, RoleData, GenericNode } from `myst-common`;

export const wordCountRole: RoleSpec = {
  name: 'word-count',
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [
        {
          type: 'word-count',
          template: data.body as string
        }
    ];
  }
};
:::

Our new role is not-yet ready to be used. We next need to tell MyST that it should be included in the main program. To do this, first we must import the role in `packages/myst-roles/src/index.ts`
```typescript
import { wordCountRole } from './word-count.js';
```
Notice the `.js` extension instead of `.ts`, it is important!

Next, we must instruct MyST to load our role when parsing a document, by adding it to `defaultRoles`:
:::{code-block} typescript
:linenos:
:emphasize-lines: 2

export const defaultRoles = [
  wordCountRole,
  abbreviationRole,
  chemRole,
  citeRole,
  deleteRole,
  mathRole,
  refRole,
  docRole,
  downloadRole,
  termRole,
  siRole,
  evalRole,
  smallcapsRole,
  subscriptRole,
  superscriptRole,
  underlineRole,
];
:::

Finally, we should _export_ the role from `myst-roles`, so that other packages may use it (should they need to!). We can do this by adding an export statement
```typescript
export { wordCountRole } from './word-count.js';
```

The final 

## Building MyST
In order to test our role, we need to build the `myst` application. Whilst a detailed description of getting started with development is [given in the README](https://github.com/executablebooks/mystmd/blob/main/README.md#development), we will outline the basic process here. Like most NodeJS applications, MyST uses the NPM package manager to manage dependencies. You will need NodeJS installed before running the commands in this section.

First, we must use `npm` in the base directory to install the MyST dependencies
```bash
npm install
```
After installing the dependencies, we can then build the MyST application
```bash
npm run build
```
The build process may take a little while, as it has to build every package when run for the first time. Subsequent calls to `npm run build` will be faster. Finally, we need to make the `myst` binary that was built available to our terminal
```bash
npm run dev
```
After running these steps, the MyST CLI (as described in {doc}`quickstart-myst-websites`) can be used.

## Investigating the AST

With a development build of our customized MyST application installed, we can see the effect of using our custom role in the MyST AST. First, we'll create a playground directory in which we can build a MyST project. Let's add a new file `demo/main.md` in which we will write the following:
```markdown
# Demo

This document is not very long. It is {word-count}`{number} words long`.
```

We can then run `myst build` in the `demo/` directory to run MyST.

[^src]: Source files are files that are added under the `src/` directory of a package, e.g. `packages/myst-roles/src/abbreviation.ts`
