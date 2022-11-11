---
title: Links
description: Create link transformers for external links that follow specific protocols.
---

The `myst-transforms` library exposes multiple ways to transform links, for example, resolving DOIs, Wikipedia links, or links to GitHub source code, and external myst protocols for cross-project references (including intersphinx).

```typescript
import { Inventory } from 'intersphinx';
import {
  linksTransform,
  WikiTransformer,
  GithubTransformer,
  RRIDTransformer,
  DOITransformer,
  MystTransformer,
} from 'myst-transforms';
import { VFile } from 'vfile';

const file = new VFile();
const intersphinx = [new Inventory({ id: 'python', path: 'https://docs.python.org/3.7' })];
const transformers = [
  new WikiTransformer(),
  new GithubTransformer(),
  new RRIDTransformer(),
  new DOITransformer(),
  new MystTransformer(intersphinx),
];
linksTransform(mdast, vfile, { transformers });
```

`WikiTransformer`
: The Wikipedia transformer picks up links to any wikipedia page, and can provide a live preview.

`GithubTransformer`
: The Github transformer allows for previewing of GitHub source files.

`RRIDTransformer`
: The RRID transformer picks up on RRIDs and allows these to be previewed.

`DOITransformer`
: The DOI transformer can validate DOIs (using `doi-utils`) and provides interactive previews of citation information.

`MystTransformer`
: The MyST transformer provides cross-reference links from `intersphinx` inventories and MyST inventories, allowing creation of persistent links between projects.
