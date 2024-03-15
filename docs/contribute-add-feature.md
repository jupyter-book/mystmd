---
title: Add a New MyST Feature
short_title: Add a Feature
--- 

In this guide, we will walk through the process of adding a new word-counter role `{word-count}` to MyST. Although it is possible to [write a plugin](plugins.md) to extend and customize MyST, this guide covers the steps required to implement this feature as a core component of MyST. We will start from the very beginning of cloning the MyST repository, and finish with a working `word-count` role!

## Cloning the Repository
The rest of this guide requires that you have basic knowledge of using Git and running commands in a terminal/shell (using one of the major operating systems). Although you can author a new MyST feature on any (supported) operating system, we will assume that you are using a typical Linux distribution for simplicity.

:::{tip} Unfamiliar with Git?
:class: dropdown

If you have not used Git before, the [Git Book](https://git-scm.com/book/) is a _comprehensive_ guide to the tool. Whilst it is recommended to develop a good understanding of Git, if you're short on time, Roger Dudler's [Git Guide](https://rogerdudler.github.io/git-guide/) describes itself as 
> just a simple guide for getting started with git. no deep shit ;)

which should cover enough to get you started.  
:::

First, let's clone the current state of the [the `mystmd` repository](https://github.com/executablebooks/mystmd).

```shell
$ git clone https://github.com/executablebooks/mystmd
```

This will populate a new `mystmd` directory in the working directory with the current checkout (snapshot) of the MyST repository. This checkout may include new features that have yet to be released to the public, or new bugs that have yet to be identified! We will modify these sources to add a new role and its associated transformation logic.

Before moving on to the next step, let's change to the `mystmd` directory
```shell
$ cd mystmd
```
From this point in the guide, terminal sessions will show the current working directory before the `$` prefix, excluding the path to the `mystmd` directory itself e.g.
```shell
$ echo MyST is cool!
MyST is cool!
$ cd packages
(packages)$ echo MyST is cool!
MyST is cool!
```

(defining-roles)=
## Defining a Role
The core specification for MyST as a markup language is defined in [the MyST spec](https://mystmd.org/spec). Most features in MyST should, over time, be incorporated into this specification so that consumers of MyST documents (such as `myst-parser` from the Jupyter Book software stack) can agree on the manner in which the contents should be parsed and rendered. Despite its importance, we can ignore exploring the process of updating the specification for this guide.

We should begin by asking the question "What is a role?" The spec [defines roles](https://mystmd.org/spec/overview#roles) as 
> similar to directives, but they are written entirely in one line.

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

Many of the "core" roles in `mystmd` are implemented in the [`myst-roles` package](https://github.com/executablebooks/mystmd/tree/mapackages/myst-roles). Although a word-count role might not be considered a "core" feature, we will pretend it is for this tutorial. Let's start by looking at the existing `abbreviation` role in [`packages/myst-roles/src/abbreviation.ts`](https://github.com/executablebooks/mystmd/blob/main/packages/myst-roles/src/abbreviation.ts)

:::{tip}
You can hover your mouse cursor over the link to [`packages/myst-roles/src/abbreviation.ts`](https://github.com/executablebooks/mystmd/blob/mapackages/myst-roles/src/abbreviation.ts) to see the contents of the file.
:::

We can see that `abbrevationRole` is annotated with the type `RoleSpec`. This is the basic type of a role declaration defined by the MyST specification. There are a number of important fields, such as the `name`, `alias`, and `body`. Our role will have the name `word-count`, and knowing that, we can define a barebones implementation that doesn't do anything! Let's add a new source file[^src] `word-count.ts` in the `myst-roles` package, and write the following:
:::{code-block} typescript
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
:::

In order to determine what should our `run` function should do, we must understand how MyST documents are built. MyST generates a website or article from a MyST Markdown file in roughly three phases, shown in the diagram below.
:::{mermaid}

graph LR;
parse[Parse Markdown into AST]
transform[Transform AST into New ASTs]
export[Export AST to Website/Article]

parse --> transform --> export
:::
At the heart of MyST is the AST, defined by the [MyST Specification](https://spec.mystmd.org/), which serves as a structured representation of a document. Whilst directives, roles, and fragments of Markdown syntax are individually processed to build this AST, transforms are performed on the _entire_ tree, i.e. over the entire document. As computing the word-count requires access to the entire document, it is clear that all of the logic of our new feature will need to be implemented as a transform. Therefore, our role definition will be very simple - generating a simple AST node that our yet-unwritten transform can later replace:

:::{code-block} typescript
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
:::

Our new role is not-yet ready to be used. We next need to tell MyST that it should be included in the main program. To do this, first we must import the role in `packages/myst-roles/src/index.ts`
:::{code-block} typescript
:filename: packages/myst-roles/src/index.ts

import { wordCountRole } from './word-count.js';
:::
Notice the `.js` extension instead of `.ts`; it is important!

Next, we must instruct MyST to load our role when parsing a document, by adding it to `defaultRoles`:
:::{code-block} typescript
:filename: packages/myst-roles/src/index.ts
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
:::{code-block} typescript
:filename: packages/myst-roles/src/index.ts

export { wordCountRole } from './word-count.js';
:::


## Building MyST
In order to test our role, we need to build the `myst` application. Whilst a detailed description of getting started with development is [given in the README](https://github.com/executablebooks/mystmd/blob/main/README.md#development), we will outline the basic process here. Like most NodeJS applications, MyST uses the NPM package manager to manage dependencies; you will need to have installed NodeJS before running the commands in this section.

First, we must use `npm` in the base directory to install the MyST dependencies
```shell
$ npm install
```
After installing the dependencies, we can then build the MyST application
```shell
$ npm run build
```
The build process may take a little while, as it has to build every package when run for the first time. Subsequent calls to `npm run build` will be faster. Finally, we need to make the `myst` binary that was built available to our terminal
```shell
$ npm run dev
```
After running these steps, the MyST CLI (as described in [](quickstart-myst-websites.md)) can be used.

## Investigating the AST

With our custom role now included in a development build of MyST, we can see it in action. First, we'll create a playground directory in which we can build a MyST project. Let's switch to a new `demo` directory
```shell
$ mkdir demo
$ cd demo
```
and add a new file `main.md` in which we will write the following:
:::{code-block} markdown
:name: main-md
:filename: demo/main.md

# Demo

This document is not very long. {word-count}`It is {number} words long`.
:::

We can then initialize a simple MyST project with 
```shell
(demo)$ myst init
```

Once `myst init` has finished setting up the project, it will ask you whether to run `myst start`. For now, we'll press {kbd}`n` to exit, because we want to run a single build (rather than continually rebuild the project on any changes).

Now we can run `myst build` in the `demo/` directory to run MyST, and build the AST for the project. 
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

As discussed in [](#defining-roles), the "business logic" of our word count feature needs to be implemented as a transform, so that we can view the entire document. Most transforms in MyST are defined in the [`myst-transforms` package](https://mystmd.org/myst-transforms), such as [the image alt-text transform](https://github.com/executablebooks/mystmd/blob/mapackages/myst-transforms/src/images.ts) which generates an image alt-text from figure captions. Our transform will need to visit every text-like node and perform a basic word-count.

Let's make a start. First, we need to implement a function that accepts a MysT AST `tree`, and modifies it in-place. We'll call it `wordCountTransform`, and define it in a new file `packages/myst-transforms/src/word-count.ts`:
:::{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts

import type { GenericParent } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {

}
:::

The MyST AST is inspired by (and re-uses parts of) [the MDAST specification](https://github.com/syntax-tree/mdast) for a Markdown abstract syntax tree. MDAST, like MyST, implements [the unist specification](https://github.com/syntax-tree/unist), which has only three node types:
- [`Node`](https://github.com/syntax-tree/unist/blob/main/readme.md#node)
- [`Parent`](https://github.com/syntax-tree/unist/blob/main/readme.md#parent)
- [`Literal`](https://github.com/syntax-tree/unist/blob/main/readme.md#literal)

These nodes form the basic building blocks of any abstract syntax tree, and `unist` defines [some utility functions](https://unifiedjs.com/explore/topic/unist-util/) to manipulate trees composed from them.

Given that we want to count _meaningful_ words, we must look at the MyST specification to determine _which_ nodes we need to look at. As MyST AST is a unist AST, and only `Literal` unist nodes can hold values, we can start by only considering `Literal` MyST nodes. The MyST specification contains [a list of all node types](https://mystmd.org/spec/myst-schema), and it can be seen that there are only a few `Literal` types, such as [`Text`](https://mystmd.org/spec/myst-schema#text) or [`HTML`](https://mystmd.org/spec/myst-schema#html). 

To begin with, let's count the words only in `Text` nodes. To do this, we'll need to pull out a list of all of the `Text` nodes from the AST. We can use the `unist-util-select` package to find all nodes with a particular [`type`](https://github.com/syntax-tree/unist/blob/main/readme.md#node), which is `'text'` for `Text` nodes:
:::{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 1,6

import { selectAll } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';


export function wordCountTransform(tree: GenericParent) {
    const textNodes = selectAll('text', tree) as GenericNode[];
}
:::
It's conventional to also define a "plugin" that makes it easy to include this transform in a suite of transformations:
:::{code-block} typescript
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
:::


Now that we have the text nodes, let's split them by whitespace, and count the total of words.

:::{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:../
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

:::

Having computed the total number of words, let's replace our `word-count` nodes with text formatted with this value. In the same way that we selected all `Text` nodes, let's select all nodes with a 'type' of `wordCount`:

:::{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 21

import type { Plugin } from 'unified';
import { selectAll } f21m 'unist-util-select';
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

:::  
Now we can use the `value` attribute of each `wordCount` node to build a new `Text` node, and store it as a child!

:::{code-block} typescript
:filename: packages/myst-transforms/src/word-count.ts
:linenos:
:emphasize-lines: 21,22,23,24,25,26,27,28,29,30,31,32,33

import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';


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
      // Format the template with the number of words
      const value = (node.value as string).replace('{number}', `${numWords}`);

      // Add the formatted `Text` node to the children
      node.children = [
        {
          type: 'text',
          value: value
        }
      ];
    });
}

export const wordCountPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    wordCountTransform(tree);
  };

:::
This pattern, of "filling-in" the children of an existing node using a transform, is commonly used in the MyST ecosystem.

If we compiled MyST with `npm run build`, we'd notice that this transform never runs. Like our earlier `word-count` role, we need to include the `wordCountTransform` in the set of MyST transforms that run during building. We can do this by adding a new _export_ line in `packages/myst-transforms/src/index.ts`:

:::{code-block} typescript
:filename: packages/myst-transforms/src/index.ts
export { wordCountTransform, wordCountTransform } from './word-count.js';
:::

Then we must use this transform in the `myst-cli` package, which contains much of the `myst build` logic. We can first import the `wordCountPlugin` in `packages/myst-cli/src/process/mdast.ts`
:::{code-block} typescript
:filename: packages/myst-transforms/src/index.ts
:linenos:
:emphasize-lines: 23

import {
  ...,
  wordCountPlugin,
} from 'myst-transforms';
:::
Finally, we'll _use_ this plugin as part of the MyST transformations in the same file
:::{code-block} typescript
:filename: packages/myst-transforms/src/index.ts
:linenos:../
:emphasize-lines: 7

export async function transformMdast(...) {
  ...
  const pipe = unified()
    .use(...) 
    .use(wordCountPlugin);
}
:::

Having modified all of the source files required to implement our word count feature, we can build `myst` and see what happens!

```shell
(demo)$ npm run build
(demo)$ myst start
```

At the time of writing, the result of running `myst start` is promising, but not quite correct.

:::{figure} images/word-count-initial-result.png

The initial result of running `myst start` with support for our new `word-count` role in [](#main-md)
:::

We can see that the rendered output is not fully inline. This is because the MyST theme (book) does not know about the `wordCount` AST node, and falls back on rendering its children (our `Text` node) inside a `<div>`.

[^src]: Source files are files that are added under the `src/` directory of a package, e.g. `packages/myst-roles/src/abbreviation.ts`
