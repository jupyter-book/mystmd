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


## Local Testing

Build the changes:

```sh
cd mystmd
bun run build
```

Run the local built CLI against the sample fixture:

```sh
cd packages/mystmd/tests/abbreviations-directive
bun ../../dist/myst.cjs build --html --ci
```

At the parser stage, the expected result is limited: MyST should recognize `{abbreviations}` as a known directive and parse it into a placeholder. You should not expect a rendered abbreviation list yet.

Validate the placeholder-to-definition-list transform directly:

```sh
cd mystmd/packages/myst-transforms
bun test tests/abbreviations-list.spec.ts
```

Run the existing inline abbreviation regression:

```sh
cd mystmd/packages/myst-transforms
bun test tests/abbreviations.spec.ts
```

The local transform test does not wire the transform into the CLI/site build. Rendered sample pages should not show the generated abbreviation list until project/site wiring is implemented.
