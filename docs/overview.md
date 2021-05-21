# Overview

Library structure:

```bash
src/
├── blocks.ts           # Block level rules
├── directives          # All directives
│   ├── index.ts        # { plugin, directives } a dictionary of the default directives
│   ├── admonition.ts   # Admonition directives
│   ├── figure.ts       # Figure directive
│   └── ...
└── roles               # All roles
    ├── index.ts        # { plugin, roles }, a dictionary of the default roles
    ├── html.ts         # HTML roles, like abbr, sub, sup ...
    ├── math.ts         # Math role
    └── ...
├── index.ts            # Exports `MyST()` and default roles/directives
├── state.ts            # Handles reference numbering
└── utils.ts
```

## Using `markdown-it-myst`

There are two ways to use the library, you can use the `MyST` wrapper,
which creates a `MarkdownIt` tokenizer for you:

```javascript
import { MyST } from 'markdown-it-myst';
const myst = MyST(); // Can override options here!
const html = myst.render(myString);
```

Alternatively, you can use this with other packages in a more granular way:

```javascript
import { plugins, roles, directives } from 'markdown-it-myst';

// Somewhere create a markdownit tokenizer:
const tokenizer = MarkdownIt('commonmark');

// Later:
tokenizer.use(plugins.math);
tokenizer.use(plugins.blocks);
tokenizer.use(plugins.directives(directives));
tokenizer.use(plugins.roles(roles));
```

## Creating a New Directive

Let's explore creating a `figure` directive, which takes an image `src` as an `argument` and has a number of `options`, such as alignment or the `name` of the figure. The content for a figure is going to be inside of a `figcaption` HTML block (which is standard [semantic HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption)!).

````markdown
```{figure} ../image.png
:name: my-figure

A cool caption! 😎
```
````


```typescript
type Args = {
  src: string;
};

type Opts = {
  name: string;
};

const figureDirective: Directive<Args, Opts> = {
  token: 'figure',
  getArguments: (info) => {
    const args = { src: info.trim() };
    return { args, content: '' };
  },
  getOptions: (data) => {
    const { name, ...rest } = data;
    unusedOptionsWarning('figure', rest);
    return { name };
  },
  renderer: (args, opts, target) => {
    const { src } = args;
    const { id, number } = target ?? {};
    return [
      'figure', { id, class: 'numbered' },
      ['img', { src }],
      ['figcaption', { number }, 0],
    ];
  },
};
```

The directive is typed with a `Directive<Args, Opts>`, which is standard Typescript, and has four important properties/functions.

#### `token`

This names the directive and must be the same token used in the dictionary lookup for all the directives that you pass into `MyST({directives: {figure}})`. This is what is recognized in the directive call (between the `{...}`):

````
```{figure}
```
````

#### `getArguments`

The directive is responsible for parsing it's arguments. These are generally relatively simple, in our case, whatever is on that line we will use as the figure's `src=""` HTML attribute.

````
```{...} info
```
````

In some cases, for example, in admonitions the rest of the info line should actually be treated as content in the directive itself. Because of this, you must pass back a dictionary containing two items from this call:

```javascript
return { args, content: '' };
```

Usually the content is empty if the `info` is used in arguments!

#### `getOptions`

The `options` for a directive come in two forms, quick `:key: value` pairs or as a YAML block:

````
```{token} info
:key: value
Content
```
````

An alternative for for arguments to be passed in is through a YAML block.
````
```{token} info
---
key: value
---
Content
```
````

The result of the options parsing is passed into the `getOptions` call. This should be used to **validate** the options, transform them into sensible things (e.g. `"false"` --> `false` etc.), as well as raise any warnings or errors on unrecognized options.

```{note}
The warnings interface is likely to change in the near future to better expose these warnings to the user/cli/etc.
```

#### `renderer`

Finally, the `renderer` call creates the HTML template that wraps any internal content. The `args`, `opts` and an *optional* `target` will be passed in, and you can read more about that in {ref}`html-templating`.

```{note}
The `renderer` method is called twice (except when the internal content are not parsed; see the `skipParsing` flag). Please do not do anything *stateful* inside of it! The `args`, `opts` and `target` will be the same object passed in both times.
```

### Additional options

* `skipParsing` - skips the internal markdown parsing for the directive (e.g. math)
* `numbered` - assigns a target of the type that is requested (e.g. 'figure')

(html-templating)=
## HTML Templating

To make it easier to write valid, escaped HTML, there is a small utility to go from a list of tags/arguments to an HTML string. This template is based on `prosemirror-model` ([see docs](https://prosemirror.net/docs/ref/#model.DOMOutputSpec)).

For example, to create the following html:

```html
<figure id="my-figure" class="numbered">
  <img src="https://example.com/image.png">
  <figcaption number="1">
    A cool caption! 😎
  </figcaption>
</figure>
```

The template is used:
```javascript
[
  'figure', { id, class: 'numbered' },
  ['img', { src }],
  ['figcaption', { number }, 0],
]
```

The number zero (pronounced "hole") is used to **insert** the child contents (usually parsed markdown) into the template. There can be at most one hole per template.
All HTML attributes and elements are escaped using `markdown-it`'s `escapeHTML` utility.

Boolean, numbers, undefined and strings are allowed to be passed in as attributes. You can also pass string arrays, which are joined with a space.

## Configuring MyST

````{admonition} TODO

Can override the directives and defaults should be accessible

```javascript
const myst = MyST({directives: {
  ...MyST.defaultDirectives,
  figure: figureDirective,
}});

myst.render('...');
```
````

## Tests

The major tests that are run are against the `fixtures` directory that compare the md to the expected html output.

These have the format:
```md
.
Testing abbriviations in MyST markdown
.
This is markdown with {abbr}`MyST (Markedly reStructured Text)`!!
.
<p>This is markdown with <abbr title="Markedly reStructured Text">MyST</abbr>!!</p>
.

```
