---
title: Adding a New MyST Feature
short_title: Add a Feature
description: This tutorial walks through the process of adding a new word-count role {word-count} to MyST as a core feature, rather than a plugin.
---

:::{important} Objective

The goal of this tutorial is to walk through the process of adding a new word-count role to MyST, `{word-count}`, as a core feature. It is also possible to extend MyST by [writing a plugin](plugins.md), however, this tutorial covers the steps required to implement a feature that ships with MyST _out-of-the-box_. We will start from the very beginning of cloning the MyST repository, and finish with a working `word-count` role!

A full, unmerged pull request of this feature is available in [#1027](https://github.com/jupyter-book/mystmd/pull/1027) to see the end-result.

:::

![](#lookout-for-tutorial-actions)

## Cloning the Repository

The rest of this tutorial requires that you have basic knowledge of using Git and running commands in a terminal/shell (using one of the major operating systems). Although you can author a new MyST feature on any (supported) operating system, we will assume that you are using a typical Linux distribution for simplicity.

:::{tip} Unfamiliar with Git?
:class: dropdown

If you have not used Git before, the [Git book](https://git-scm.com/book/) is a _comprehensive_ guide to the tool. Whilst it is recommended to develop a good understanding of Git, if you're short on time, Roger Dudler's [Git Guide](https://rogerdudler.github.io/git-guide/), should cover enough to get you started.
:::

🛠 Clone [the `mystmd` repository](https://github.com/jupyter-book/mystmd)

```shell
$ git clone https://github.com/jupyter-book/mystmd
```

This will populate a new `mystmd` directory in the working directory with the current checkout (snapshot) of the MyST source code. This checkout may include new features that have yet to be released to the public, or new bugs that have yet to be identified!

🛠 Change to the `mystmd` directory

```shell
$ cd mystmd
```

From this point in the tutorial, terminal sessions will show the current working directory before the `$` prefix, excluding the path to the `mystmd` directory itself, for example:

```shell
$ echo MyST is cool!
MyST is cool!
$ cd packages
(packages)$ echo MyST is cool!
MyST is cool!
```

(defining-roles)=

## Defining a Role

The core specification for the MyST markup language is defined in [the MyST spec](https://mystmd.org/spec). Most features in MyST should, over time, be incorporated into this specification so that consumers of MyST documents (such as `myst-parser` from the Jupyter Book software stack) agree on the manner in which the content should be parsed and rendered. The process of adding features to the MyST Spec is more formalized, and is described in the [MyST Enhancement Proposals](https://mep.mystmd.org). This tutorial does not cover updating the MyST Spec.

We should begin by asking the question "What is a role?" The spec [defines roles](https://mystmd.org/spec/overview#roles) as:

> similar to directives, but they are written entirely in one line.

One such role is the {myst:role}`underline` role, which can be used to format text:

```{myst}
The following text {underline}`is underlined`
```

We want to create a _new_ `word-count` role that injects the total word count into a document. It should accept a format-string that allows us to format the resulting text, i.e.

```markdown
This is a lengthy document ...

{word-count}`The number of words in this document is {number} words`
```

should become

```markdown
This is a lengthy document ...

The number of words in this document is 5 words
```

Many of the "core" roles in `mystmd` (including {myst:role}`underline`) are implemented in the [`myst-roles` package](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-roles). Although a word-count role might not be considered a "core" feature, we will pretend it is for this tutorial. Let's start by looking at the existing {myst:role}`abbreviation` role in [`packages/myst-roles/src/abbreviation.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/abbreviation.ts)

:::{tip}
You can hover your mouse cursor over the link to [`packages/myst-roles/src/abbreviation.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/abbreviation.ts) to see the contents of the file. 🥳
:::

We can see that `abbreviationRole` is annotated with the type `RoleSpec`. This is the basic type of a role declaration defined by the MyST specification. There are a number of important fields, such as the `name`, `alias`, and `body`.

🛠 Add a new source file[^src] `word-count.ts` in the `myst-roles` package, and write the following.

[^src]: Source files are files that are added under the `src/` directory of a package, e.g. `packages/myst-roles/src/abbreviation.ts`

```{code-block} typescript
:filename: packages/myst-roles/src/word-count.ts

import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

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

This defines a simple role called `word-count`, whose _body_ (the raw text between the backticks in `` {word-count}`<BODY>` ``) is a string.
:::{tip} Other kinds of `role` body types
:class: dropdown

It is also possible to write a role whose body is an AST, using `type: 'myst'`, e.g. [the `underline` role](https://github.com/jupyter-book/mystmd/blob/e07d55a0b32673ff9d557991ea1260c5f0bf835e/packages/myst-roles/src/underline.ts#L7). Declaring `body` as a MyST AST allows us to implement more complex markup, such as nesting roles-in-roles:

```{myst}
The following text {underline}`is underlined and also **bold!**`
```

For our role, however, we are keeping things simple!
:::

With an empty `run` function, this role doesn't do anything! In order to determine what should our `run` function _should_ do, we must understand how MyST documents are built. MyST generates a website or article from a MyST Markdown file in roughly three phases, shown in the diagram below.

:::{mermaid}

graph LR;
parse[Parse Markdown into AST]
transform[Transform AST into New ASTs]
export[Export AST to Website/Article]

parse --> transform --> export
:::

At the heart of MyST is the AST, defined by the [MyST Specification](https://spec.mystmd.org/), which serves as a structured representation of a document. Whilst directives, roles, and fragments of Markdown syntax are individually processed to build this AST, transforms are performed on the _entire_ tree, i.e. over the entire document. As computing the word-count requires access to the entire document, it is clear that all of the logic of our new feature will need to be implemented as a transform. Therefore, our role definition will be very simple - generating a simple AST node that our yet-unwritten transform can later replace.

🛠 Modify `word-count.ts`

```{code-block} typescript
:linenos:
:filename: packages/myst-roles/src/word-count.ts
:emphasize-lines: 10,11,12,13,14,15

import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const wordCountRole: RoleSpec = {
  name: 'word-count',
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [
        {
          type: 'wordCount',
          value: data.body as string
        }
    ];
  }
};
```

Our new role is not-yet ready to be used. We next need to tell MyST that it should be included in the main program.

🛠 Import the role in `packages/myst-roles/src/index.ts`

```{code-block} typescript
:filename: packages/myst-roles/src/index.ts

import { wordCountRole } from './word-count.js';
```

Notice the `.js` extension instead of `.ts`; it is important, this is just [how typescript works](https://www.typescriptlang.org/docs/handbook/modules/reference.html#the-moduleresolution-compiler-option).

Next, we must instruct MyST to load our role when parsing a document.

🛠 Add `wordCountRole` to `defaultRoles`:

```{code-block} typescript
:filename: packages/myst-roles/src/index.ts
:linenos:
:emphasize-lines: 2

export const defaultRoles = [
  wordCountRole,
  abbreviationRole,
  chemRole,
  citeRole,
  ...
];
```

Finally, we should _export_ the role from `myst-roles`, so that other packages may use it (should they need to!).

🛠 Add an export statement from the `myst-roles` package

```{code-block} typescript
:filename: packages/myst-roles/src/index.ts

export { wordCountRole } from './word-count.js';
```

In order to try out our new `word-count` role, we need to build the `myst` application.

🛠 Install packages, build and link myst. See [](./contribute-build-locally.md) for more details.

```shell
$ npm install
$ npm run build
$ npm run link
```

After running these steps, the MyST CLI (as described in [](./quickstart-myst-documents.md)) can be used.

## Create a Demo

With our custom role now included in a development build of MyST, we can see it in action. First, we'll create a playground directory in which we can build a MyST project.

🛠 Create a new `demo` directory, outside of the `mystmd` source.

```shell
$ mkdir demo
$ cd demo
```

and add a new file `main.md` in which we will write the following:

```{code-block} markdown
:label: main-md
:filename: demo/main.md

# Demo

This document is not very long.
{word-count}`It is {number} words long`.
```

🛠 Initialize a simple MyST project with:

```shell
(demo)$ myst init
```

Once `myst init` has finished setting up the project, it will ask you whether to run `myst start`, we don't want to start the server now as we are going to create a single build.

🛠 Press {kbd}`n` to exit `myst init`[^or-kill-process]

[^or-kill-process]: If you have already started the server, use {kbd}`Ctrl`-{kbd}`C` to kill the process.

## Investigate the AST

Now we can run `myst build` in the `demo/` directory to run MyST.

🛠 Build the AST for the entire project

```shell
(demo)$ myst build
```

MyST outputs the final AST in the `_build/site/content` directory. Running `ls`, we can see

```shell
(demo)$ ls _build/site/content
main.json
```

The contents of `main.json` are the MyST AST. We can pretty-print the file with the `jq` utility

```shell
(demo)$ jq . _build/site/content/main.json
```

The new `wordCount` node generated by our `wordCount` role can clearly be seen:

```json
{
    ...
    {
      "type": "wordCount",
      "value": "{number} words long"
    },
    ...
}
```

## Writing a Transform

As discussed in [](#defining-roles), the logic of our word count feature needs to be implemented as a transform, so that we can view the entire document. Most transforms in MyST are defined in the [`myst-transforms` package](https://mystmd.org/myst-transforms), such as [the image alt text transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/images.ts) which generates an image [alt text](https://en.wikipedia.org/wiki/Alt_attribute) from figure captions. Our transform will need to visit every text-like node and perform a basic word-count.

Let's make a start. First, we need to implement a function that accepts a MyST AST `tree`, and modifies it in-place.

🛠 Create a `wordCountTransform` in a new file `packages/myst-transforms/src/word-count.ts`

```{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts

import type { GenericParent } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {

}
```

The MyST AST is inspired by (and re-uses parts of) [the MDAST specification](https://github.com/syntax-tree/mdast) for a Markdown abstract syntax tree. MDAST, like MyST, implements [the unist specification](https://github.com/syntax-tree/unist), which has only three node types:

- [`Node`](https://github.com/syntax-tree/unist/blob/main/readme.md#node)
- [`Parent`](https://github.com/syntax-tree/unist/blob/main/readme.md#parent)
- [`Literal`](https://github.com/syntax-tree/unist/blob/main/readme.md#literal)

These nodes form the basic building blocks of any abstract syntax tree, and `unist` defines [some utility functions](https://unifiedjs.com/explore/topic/unist-util/) to manipulate trees composed from them.

Given that we want to count _meaningful_ words, we must look at the MyST specification to determine _which_ nodes we need to look at. As MyST AST is a unist AST, and only `Literal` unist nodes can hold values, we can start by only considering `Literal` MyST nodes. The MyST specification contains [a list of all node types](https://mystmd.org/spec/myst-schema), and it can be seen that there are only a few `Literal` types, such as [`Text`](https://mystmd.org/spec/myst-schema#text) or [`HTML`](https://mystmd.org/spec/myst-schema#html).

To begin with, let's count the words only in `Text` nodes. To do this, we'll need to pull out a list of all of the `Text` nodes from the AST. We can use the `unist-util-select` package to find all nodes with a particular [`type`](https://github.com/syntax-tree/unist/blob/main/readme.md#node).

🛠 Modify the transform to select all the `'text'` nodes

```{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 1,6

import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {
    const textNodes = selectAll('text', tree) as GenericNode[];
}
```

It's conventional to also define a "plugin" that makes it easy to include this transform in a suite of transformations.

🛠 Export a plugin to invoke the transform

```{code-block} typescript
:linenos:
:emphasize-lines: 1,10,11,12,13

import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {
    const textNodes = selectAll('text', tree) as GenericNode[];
}

export const wordCountPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    wordCountTransform(tree);
  };
```

Now that we have the text nodes, let's split them by whitespace, and count the total of words.

🛠 Implement the logic to count the words

```{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 8,9,10,11,12,13,14,15,16,17,18,19

import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {
  const textNodes = selectAll('text', tree) as GenericNode[];
  const numWords = textNodes
    // Split by space
    .map(node => (node.value as string).split(" "))
    // Filter punctuation-only words
    .map(words => words.filter(word => word.match(/[^.,:!?]/)))
    // Count words in each `Text` node
    .map(words => words.length)
    // Sum together the counts
    .reduce(
      (total, value) => total + value,
      0
    );
}

export const wordCountPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    wordCountTransform(tree);
  };
```

Having computed the total number of words, let's replace our `word-count` nodes with text formatted with this value. In the same way that we selected all `Text` nodes

🛠 Select all nodes with a 'type' of `wordCount`

```{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 21

import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {
  const textNodes = selectAll('text', tree) as GenericNode[];
  const numWords = textNodes
    // Split by space
    .map(node => (node.value as string).split(" "))
    // Filter punctuation-only words
    .map(words => words.filter(word => word.match(/[^.,:!?]/)))
    // Count words in each `Text` node
    .map(words => words.length)
    // Sum together the counts
    .reduce(
      (total, value) => total + value,
      0
    );

  const countNodes = selectAll('wordCount', tree) as GenericParent[];
}

export const wordCountPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    wordCountTransform(tree);
  };

```

Now we can use the `value` attribute of each `wordCount` node to transform this into a known node type of a `text` node.

🛠 Change the node to `text` and replace `{number}` with the word count

```{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 22,23,24,25,26,27

import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {
  const textNodes = selectAll('text', tree) as GenericNode[];
  const numWords = textNodes
    // Split by space
    .map(node => (node.value as string).split(" "))
    // Filter punctuation-only words
    .map(words => words.filter(word => word.match(/[^.,:!?]/)))
    // Count words in each `Text` node
    .map(words => words.length)
    // Sum together the counts
    .reduce(
      (total, value) => total + value,
      0
    );

  const countNodes = selectAll('wordCount', tree) as GenericParent[];
  countNodes.forEach(node => {
    // Change the node type to text
    node.type = 'text';
    // Replace the number with the word count
    node.value = (node.value as string).replace('{number}', `${numWords}`);
  });
}

export const wordCountPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    wordCountTransform(tree);
  };

```

This pattern, of mutating existing nodes using a transform, is commonly used in the MyST ecosystem. If you want to keep information about the node's source, for example, to style it differently, you could store a flag on `data` or `kind`. If you are introducing a new node into the final rendered document, that will require you to add a new renderer. By staying within the existing node types, all existing renderers will work out of the box.

If we build MyST with `npm run build`, we'd notice that this transform never runs. Like our earlier `word-count` role, we need to include the `wordCountTransform` in the set of MyST transforms that run during building.

🛠 Add a new _export_ line in `packages/myst-transforms/src/index.ts`

```{code-block} typescript
:filename: packages/myst-transforms/src/index.ts
export { wordCountTransform, wordCountPlugin } from './word-count.js';
```

Then we must use this transform in the `myst-cli` package, which contains much of the `myst build` logic.

🛠 Import the `wordCountPlugin` in `packages/myst-cli/src/process/mdast.ts`

```{code-block} typescript
:filename: packages/myst-cli/src/process/mdast.ts
:linenos:
:emphasize-lines: 3

import {
  ...,
  wordCountPlugin,
} from 'myst-transforms';
```

Finally, we'll _use_ this plugin as part of the MyST transformations in the same file

🛠 Add the `wordCountPlugin` to the unified pipe of transformations

```{code-block} typescript
:filename: packages/myst-cli/src/process/mdast.ts
:linenos:
:emphasize-lines: 5

export async function transformMdast(...) {
  ...
  const pipe = unified()
    .use(...)
    .use(wordCountPlugin);
}
```

Having modified all of the source files required to implement our word count feature.

🛠 Run `npm run build` to build the `myst` package

Now let's see what happens over in our demo!

🛠 In your demo directory, run `myst start`

```shell
(demo)$ myst start
```

This will result in the following page with the word count that excludes it's own text!

:::{figure} images/word-count-initial-result.png
:class: framed
:align: left

The result of running `myst start` with support for our new `word-count` role in [our document](#main-md).
:::

## Contributing

The next steps to bring this into being a core feature would be [adding documentation](./contribute-docs.md) and running `npm run changeset` to add a description of what you have completed. You can then open a pull request, and the developers of MyST will aim to get this into MyST and released so everyone can use it!

A full, unmerged pull request of this feature is available in [#1027](https://github.com/jupyter-book/mystmd/pull/1027) to see the end-result.

Thanks for your contributions! 🥳
