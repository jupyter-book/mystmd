# myst-transforms

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
