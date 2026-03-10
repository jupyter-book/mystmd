---
title: Generate MyST AST with Plugins
---

A common use case with plugins involves generating {term}`MyST AST` and inserting it into the document.
This page covers a few ways that you can do so.

(plugins:ctx)=

## Parse MyST markdown to AST in a directive or role

### With a function call

The `parseMyst` function (available in the `ctx` variable) provides an explicit method to parse MyST text into {term}`MyST AST`.
Here's an example of using the `parseMyst` function within a directive plugin to parse the _body_ of the directive into MyST AST:

```{code} javascript
:filename: myplugin.mjs
const myDirective = {
  name: "mydirective",
  doc: "My new directive!",
  // Here the body is passed as a string
  body: { type: String, doc: "To be parsed into MyST AST." },
  run(data, vfile, ctx) {
    // Here we parse the body into MyST AST
    const ast = ctx.parseMyst(data.body);
    return ast.children[0];
  },
};
```

`ctx.parseMyst` returns a {term}`root node <Root AST node>` which contains the parsed MyST as children.
The directive plugin example above returns `ast.children[0]` (the first child of the root node) to avoid creating a malformed document (there can only be one "root").

You can use the `parseMyst` function to construct MyST outputs from text generated with string interpolation, for example:

```{code} javascript
:filename: justacard.mjs
const myDirective = {
  name: "justacard",
  doc: "Basically does what a card directive does!",
  arg: { type: String, doc: "To be parsed into MyST AST." },
  body: { type: String, doc: "The body of the directive." },
  run(data, vfile, ctx) {
    // Here we parse a string that defines a multi-line card directive
    const ast = ctx.parseMyst(`:::{card} ${data.arg}\n${data.body}\n:::`);
    return ast.children[0];
  },
};
```

:::{tip} If you need to use multi-line strings you must dedent them
:class: dropdown

The example above puts a multi-line string onto one line by manually coding the `\n` characters.
If you instead want to show a multi-line string in your code, you will need to remove the indentation manually, for example like the following:

```{code} javascript
:filename: justacard.mjs
const myDirective = {
  name: "justacard",
  doc: "Basically does what a card directive does!",
  arg: { type: String, doc: "To be parsed into MyST AST." },
  body: { type: String, doc: "The body of the directive." },
  run(data, vfile, ctx) {
    // By removing the indentation white-space the string is correctly parsed
    const ast = ctx.parseMyst(`
:::{card} ${data.arg}
${data.body}
:::`);
    return ast.children[0];
  },
};
```

:::

### With automatic parsing

You can define a plugin's argument or body as `{type: 'myst'}` instead of `{type: String}` to enable those parameters to be autuomatically parsed into {term}`AST nodes <AST node>`.
In this case, `data.body` will be a list of AST nodes instead of text:

```{code} javascript
:filename: myplugin.mjs
:linenos:
:emphasize-lines: 5
const myDirective = {
  name: "mydirective",
  doc: "My new directive!",
  // By defining type: 'myst', the directive body will automatically be parsed into MyST AST
  body: {
    type: 'myst',
    doc: "Pre-parsed and immediately usable as MyST AST.",
  },
  run(data) {
    return data.body[0];
  },
};
```

## Use the MyST Sandbox to identify AST structure

The [MyST interactive sandbox](https://mystmd.org/sandbox) is a great way to explore what MyST looks like when it is rendered, and what its underlying AST structure looks like. This is particularly useful if you're generating MyST AST from scratch. For example, as part of a [plugin role or directive](./plugins.md).

:::{important}
Plugins must return "POST" AST, so ensure that the "POST" option at the top-right of the sandbox interface is selected!
:::

```{figure} videos/sandbox-demo.mp4
Here's how you can use [the MyST sandbox](https://mystmd.org/sandbox) to explore the structure of a `card` directive and preview its AST.
```

:::{note} Click here to see the full output of the MyST sandbox
:class: dropdown

The output of the sandbox AST generator can be seen in @code:ast. The highlighted outer `root` and `block` nodes are always included in the output, and contain the interesting AST (in this case, a `card`).

```{code} json
:linenos:
:emphasize-lines: 1-6,30-33
:label: code:ast
:caption: The AST of a card directive, produced by the MyST sandbox.
{
  "type": "root",
  "children": [
    {
      "type": "block",
      "children": [
        {
          "type": "card",
          "children": [
            {
              "type": "cardTitle",
              "children": [
                {
                  "type": "text",
                  "value": "My title"
                }
              ]
            },
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "text",
                  "value": "My card body."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

:::
