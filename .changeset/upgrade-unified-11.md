---
'myst-common': minor
'markdown-it-myst': minor
'myst-roles': minor
'myst-directives': minor
'myst-to-html': minor
'myst-transforms': minor
'myst-parser': minor
'myst-execute': minor
'myst-migrate': minor
'myst-ext-button': minor
'myst-ext-exercise': minor
'myst-ext-icon': minor
'myst-ext-tabs': minor
'myst-to-md': minor
'myst-to-tex': minor
'myst-to-typst': minor
'myst-to-docx': minor
'myst-to-jats': minor
'jats-to-myst': minor
'tex-to-myst': minor
'myst-cli': minor
---

Upgrade to `unified@11`, `vfile@6`, `@types/mdast@4`, `@types/unist@3` and the current majors of the unist, mdast and hast utilities.

Changes visible to users and plugin authors:

- Cross-reference and caption text filled from templates is now a single text node in the site JSON (e.g. `"Figure 1:"` instead of `"Figure "`, `"1"` and `":"`). Rendered output is unchanged.
- TypeScript plugins and libraries now see the `unified@11` and `@types/unist@3` types. `utils.select` in the plugin API still returns `null` when nothing matches, but plugins calling `unist-util-select` directly now get `undefined`.
- `TransformSpec.plugin` is typed as a `GenericParent` transformer, which may be async. `MessageInfo.node` and `toText` accept any node, and `forcedRemove` is now exported from `myst-common`.
- `myst-to-html` exports `htmlToMdast` and `createMdastNode`, the HTML to mdast conversion shared with `myst-transforms`.
