# myst-transforms

## 1.1.9

### Patch Changes

- 70748f52: Remove unicode characters by default

## 1.1.8

### Patch Changes

- myst-to-html@1.0.12

## 1.1.7

### Patch Changes

- myst-to-html@1.0.11

## 1.1.6

### Patch Changes

- a7f830af: Support for sub-equations, including adding the MathGroup node.
- Updated dependencies [417efdc9]
- Updated dependencies [a7f830af]
- Updated dependencies [1574ff8]
  - myst-spec-ext@1.1.11
  - myst-common@1.1.11

## 1.1.5

### Patch Changes

- 34d4c2bd: Include transform was async, now awaiting it
- 8bd4ee2e: Improve HTML transforms for grouping and processing
- Updated dependencies [5737951e]
  - myst-spec-ext@1.1.10
  - myst-common@1.1.10

## 1.1.4

### Patch Changes

- ddf2a189: Block nesting updates
- 912e8b54: Note that alt text is auto generated from the caption.
- fde21440: Add support for proofs in LaTeX
- 27f48dba: Improve mathML export
- 8b7b5fe6: Update dependencies
- Updated dependencies [6d0e4e3f]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [8b7b5fe6]
  - myst-common@1.1.9
  - myst-to-html@1.0.10
  - myst-spec-ext@1.1.9

## 1.1.3

### Patch Changes

- 9a9b3953: 📦 Update types for hast updates
- Updated dependencies [9a9b3953]
  - myst-to-html@1.0.9

## 1.1.2

### Patch Changes

- b74fb3c1: Add ruleId to file warnings in redux store
- 392ba779: Move includeDirective transform to myst-transforms and make it generic for use in JupyterLab
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- 757f1fe4: Search for unmatched citations and use them as cross references or warn.
- 60cf9a53: Add filename to codeblock and include directives
- Updated dependencies [d35e02bc]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [4183c05c]
- Updated dependencies [392ba779]
- Updated dependencies [757f1fe4]
- Updated dependencies [239ae762]
- Updated dependencies [b74fb3c1]
- Updated dependencies [86c78957]
- Updated dependencies [60cf9a53]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [99659250]
  - myst-common@1.1.7
  - myst-spec-ext@1.1.7
  - myst-to-html@1.0.8

## 1.1.1

### Patch Changes

- 7752cb70: Bump dependency versions
- 7752cb70: Add html transform that combines related html nodes
- Updated dependencies [7752cb70]
- Updated dependencies [7752cb70]
  - myst-to-html@1.0.7
  - myst-common@1.1.5
  - myst-spec-ext@1.1.5

## 1.1.0

### Minor Changes

- 30da1dab: Add `firstTimeLong` option to the abbreviations transform to expand the abbreviation the first time it is encountered.

### Patch Changes

- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types
- fee1eea5: Translate mermaid and math code blocks by default.
- 2960da05: Transform code blocks with `math` language to be math blocks. This is GitHub markdown.
- Updated dependencies [24c0aae7]
  - myst-common@1.1.2
  - myst-spec-ext@1.1.2

## 1.0.6

### Patch Changes

- 5dd77afe: Expand to allow for new github admonitions [!NOTE] in a blockquote

## 1.0.5

### Patch Changes

- Updates to internal dependencies
- 50fddc70: Add error message to YAML failure
- Updated dependencies [44ff6917]
- Updated dependencies
  - myst-common@1.1.0
  - myst-spec-ext@1.1.0

## 1.0.4

### Patch Changes

- 1a191c89: Log errors instead of throwing on page frontmatter yaml load
- Updated dependencies [7b72b097]
- Updated dependencies [7b72b097]
- Updated dependencies [f44ee18d]
  - myst-spec-ext@1.0.3
  - myst-common@1.0.4

## 1.0.3

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - myst-spec-ext@1.0.2
  - myst-common@1.0.2

## 1.0.2

### Patch Changes

- 714b594f: Propogate identifiers from mystRoles and mystDirectives to their children when lifting

## 1.0.1

### Patch Changes

- 92fd39df: Allow intersphinx to connect without a target
- 3b32538b: Track url source when enumerating nodes

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - myst-spec-ext@1.0.0

## 0.0.32

### Patch Changes

- de66ba19: Include html_id in the enumerator transform for local and remote links
- f97d4d50: Add abbreviation frontmatter option to add abbreviations automatically to documents.
- de66ba19: Add glossary and term directives

## 0.0.31

### Patch Changes

- a7584e27: Add transform for gated directives
- e98f86a6: Unnest links from cross references
- 71e91665: Initial support for sphinx-exercise
- bb019ae9: Add `unist-util-remove` to package dependencies.

## 0.0.30

### Patch Changes

- 034ce741: Add pull requests and issues to known github links
- ce8932e0: Pick up frontmatter title that has a label/target node in front of it.

## 0.0.29

### Patch Changes

- 78b7232e: Add support for sphinx proofs
- Updated dependencies [79e24fd7]
- Updated dependencies [b2ac9d13]
  - myst-common@0.0.17
  - myst-spec-ext@0.0.12

## 0.0.28

### Patch Changes

- 96018fec: Link/xref url respects index url, dataUrl is also provided for accessing mdast

## 0.0.27

### Patch Changes

- 09a34b20: Ensure that Figure cross-references have no-break-spaces
- 3da85094: Add `enumerator` to footnote spec and transform (same as deprecated `number`)
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [3da85094]
  - myst-spec-ext@0.0.11

## 0.0.26

### Patch Changes

- 3a42cd9e: Transform wikipedia links properly, including removing `_` and properly removing `wiki:` in all cases.

## 0.0.25

### Patch Changes

- Updated dependencies [d28b5e9d]
  - myst-common@0.0.16

## 0.0.24

### Patch Changes

- c832b38e: FootnoteDefinitions remain on the mdast tree during processing
- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15

## 0.0.23

### Patch Changes

- 5fc02589: Stop hoisting deep headings into frontmatter title
- Updated dependencies [45ecdf86]
  - myst-spec-ext@0.0.9

## 0.0.22

### Patch Changes

- 78b30547: Replace &=& with &= when replacing tex eqnarray with align\*
- 794fbc80: Works with undefined yaml block
- Updated dependencies [833be5a9]
  - myst-spec-ext@0.0.8

## 0.0.21

### Patch Changes

- efe55199: Turn on code enumeration by default
- Updated dependencies [9fcf25a9]
  - myst-spec-ext@0.0.7

## 0.0.20

### Patch Changes

- f227a9e2: Add rehype-remark
- f227a9e2: Add rehype-parse
- f227a9e2: Add unist-util-find-after
- f227a9e2: Add mdast-util-find-and-replace

## 0.0.19

### Patch Changes

- Updated dependencies [9105d991]
  - myst-common@0.0.14

## 0.0.18

### Patch Changes

- 78bb237e: Support github-style admonitions, add the `simple` class
- a9f5bf70: Add comment to default html-to-mdast handlers
- Updated dependencies [e443ad2a]
  - myst-spec-ext@0.0.6

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
- 184ad9f9: Move to https://github.com/executablebooks/mystmd
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
