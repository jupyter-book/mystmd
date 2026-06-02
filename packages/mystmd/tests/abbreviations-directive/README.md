# Abbreviations Directive Sample

This sample is intentionally not an automated test yet.

Use it while implementing issue 1098 in a quasi-TDD loop:

```sh
myst build --html --ci
```

Expected eventual behavior:

- `index.md` renders an `Abbreviations` heading followed by a definition list.
- The list includes `API`, `CLI`, and `MyST`.
- The list omits `SHRILL` because its metadata value is `null`.
- `page.md` preserves the directive `label` and `class` metadata on the generated wrapper block.
- Once project-wide aggregation is implemented, `page.md` can include both project abbreviations and page-level `AST`.

Before 1098 is implemented, this sample is expected to expose missing directive support.


### Local testing
Building the changes requires:

1. Build the changes
```
  cd mystmd
  bun run build
```
2. Then run the local built CLI against the sample fixture:
```
  cd packages/mystmd/tests/abbreviations-directive
  bun ../../dist/myst.cjs build --html --ci
```
  The expected result is limited: MyST should recognize {abbreviations} as a known directive
  and parse it into a placeholder. You should not expect a rendered abbreviation list yet; that comes later.

3. Run the focused tests:
```
  cd mystmd
  bun test packages/myst-directives/src/abbreviations.spec.ts
```
  And the directive package regression:
```
  bun test packages/myst-directives/src
```