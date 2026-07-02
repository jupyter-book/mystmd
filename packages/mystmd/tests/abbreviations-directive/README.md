# Abbreviations Directive Sample

This fixture exercises the `{abbreviations}` directive during local development.

Current content files:

- `index.md`: directive on the landing page, plus inline abbreviation text.
- `page-1.md`: page-level `AST` abbreviation and directive options.
- `page-2.md`: page-level `GPU` abbreviation without a directive.
- `page-3.md`: multiple page-level abbreviations without a directive.

`README.md` is intentionally not listed in `project.toc`, so it is not built as a page.

The current `myst.yml` was generated with:

```sh
bun ../../dist/myst.cjs init --project --site --write-toc
```

Review `myst.yml` after regenerating it. The generated file may need manual edits for:

- `project.abbreviations`, if you want project-level definitions such as `API`, `CLI`, or `MyST`.
- `project.toc`, if you want to keep `README.md` excluded or reorder pages.
- `site.template`, if the generated template differs from the fixture expectation.

Expected behavior:

- Pages with `{abbreviations}` render a generated definition list.
- The generated list includes non-null abbreviations collected from the project pages.
- Null-valued abbreviations are omitted.
- `page-1.md` preserves the directive `label` and `class` metadata on the generated wrapper block.

## Local Testing

From the repo root, rebuild local packages:

```sh
cd mystmd
bun run build -- --force
```

Run the local built CLI against the sample fixture:

```sh
cd packages/mystmd/tests/abbreviations-directive
bun ../../dist/myst.cjs build --ci
```

Inspect generated page JSON:

```sh
ls _build/site/content
rg '"part": "abbreviations"|definitionList|AST|GPU|Algo|SA' _build/site/content
```

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

Run the focused end-to-end fixture test:

```sh
cd mystmd
bun test packages/mystmd/tests/endToEnd.spec.ts -t "Abbreviations directive site build"
```

The focused end-to-end case should stay aligned with `project.toc`; it checks that site JSON is generated for `index.md`, `page-1.md`, `page-2.md`, and `page-3.md`.
