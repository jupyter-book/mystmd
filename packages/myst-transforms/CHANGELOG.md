# myst-transforms

## 0.0.17

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13

## 0.0.16

### Patch Changes

- ea89d8b2: Update admonition title to always be the argument.
- a2a7044b: Deprecate codeBlockPlugin for the caption parsing, which now happens in myst-parser and myst-directives
- Updated dependencies [987c1053]
  - myst-spec-ext@0.0.5

## 0.0.15

### Patch Changes

- 6da5544f: Embed block content (including notebook cells) based on block or code cell label in metadata

## 0.0.14

### Patch Changes

- 160e954f: Target propagration should happen after `mystDirectives` have been lifted fixed to work for directives.

  Deprecated the `mystCleanup` in favour of a more descriptive name (`liftMystDirectivesAndRoles`) for both the plugin and transform.

- Updated dependencies [f0d2da60]
- Updated dependencies [160e954f]
  - myst-spec-ext@0.0.4

## 0.0.13

### Patch Changes

- 27388448: Update packages to unstarred versions
- Updated dependencies [27388448]
  - myst-common@0.0.12
  - myst-spec-ext@0.0.3

## 0.0.12

### Patch Changes

- e7330dbb: Add more percise position information for math errors
- a5daa0d6: formatLinkText so that long URLs are formatted better in html, including breaking on long lines
- Updated dependencies [e7330dbb]
  - myst-common@0.0.11
  - intersphinx@0.0.7

## 0.0.11

### Patch Changes

- 4e27734b: Citations, Footnotes, and References type consolidated to myst-common
- Updated dependencies [4e27734b]
  - myst-common@0.0.9

## 0.0.10

### Patch Changes

- adb6e7fa: Create a `unnestTransform` that generically unnests children elements in a parent. Used for typosgraphy and math nested in a paragraph.
- 11ff02b4: Update doi-utils to 1.0.9
- Updated dependencies [11ff02b4]
  - myst-common@0.0.8
  - intersphinx@0.0.6

## 0.0.9

### Patch Changes

- fced5986: Migrate to myst-spec-ext types to centralize additions to the spec.
- 0170a2cc: Lift equations out of paragraphs.

  Generally displayed math is **not** inside of a paragraph, the exception is inside bullet lists and tables, or dollar-math that is created without new lines around it. Because these nodes are a div, they are rendered inside of a paragraph, which is not correct HTML. This throws exceptions in React, it works, but causes a client-side re-render, which flickers.

- 3baa63eb: Ensure github url parse is safe without http or https
- Updated dependencies [73db6da8]
  - myst-common@0.0.6

## 0.0.8

### Patch Changes

- 17daf15e: Introduce GithubTransformer for file links.
- 184ad9f9: Move to https://github.com/executablebooks/mystjs
- Updated dependencies [184ad9f9]
- Updated dependencies [3fba7cb7]
  - intersphinx@0.0.4
  - myst-common@0.0.5

## 0.0.7

### Patch Changes

- 7808157: Allow linkTransform to have a selector to look up the links

## 0.0.6

### Patch Changes

- a8e68ec: Enumerate only update the template if new
- b96c7a4: Create number references for footnotes that skip reserved numbers, still look up on identifier
- Updated dependencies [9b1fa05]
- Updated dependencies [9b1fa05]
  - intersphinx@0.0.2

## 0.0.5

### Patch Changes

- The package myst-utils was renamed to myst-common, we missed registering this by 7 hours. Super annoying, but it needs a bump across all packages.
- Updated dependencies
  - intersphinx@0.0.2
  - myst-common@0.0.3

## 0.0.4

### Patch Changes

- 327c19c: Introduce new link transforms for internal and external protocols including dois, rrids, wiki, and myst.
- 6b4c188: Introduce blockMetadataTransform that puts the metadata for a block on the data field.
- f6ad6c9: Improve wiki links to use language and links from the url if supplied.
- 2f6e43a: Add blockquote attribution to add sources for quotes
- f6ad6c9: Improve error mesasges for numbering references. Including numbering equations by their {name} == id, rather than by "Equation".
- f6ad6c9: Imporve error messages for unlinked references that start with `#`
- 631ee7c: Create intersphinx package
- 5460169: Add intersphinx interoperability (read) as well as markdown links syntax for referencing.
- Updated dependencies [2b85858]
  - myst-common@0.0.2

## 0.0.3

### Patch Changes

- b63638b: Allow admonition headers to be optionally set by bold text or a heading
- b63638b: Handle equation environment duplicates
- b63638b: Pull out frontmatter AST parsing into myst-transforms
- b63638b: Improve math parsing and split out label and equation parsing into different transform

## 0.0.2

### Patch Changes

- 619328f: Improve cross-referencing of content in a book
- 619328f: Bring transforms into the frontend to allow for improved demo component
- 619328f: Change error reporting to use vfile
