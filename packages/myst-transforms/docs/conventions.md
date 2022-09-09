---
title: Conventions
description: Conventions that are in place across all transformations.
---

The convention used for all `myst-transforms` is to modify the tree in place and export two functions for `transforms` and `plugins` the plugins are `unifiedjs` plugins that can be chained together, for example, `unified().use(myPlugin, opts).use(myOtherPlugin)`. These plugins are generally very light wrappers around transforms which are the funcitonal analogues of the plugin. The `transforms` are called on a `tree`, for example, `myTransform(tree, opts)`.

In all cases transformations are completed in place on the mdast tree.

## Error Reporting

The package uses `vfile` error reporting messages, this allows you to collect

```typescript
import { VFile } from 'vfile';

const file = new VFile();

unified()
  .use(mathPlugin, { macros: {} }) // Add the plugin with any options
  .run(tree, file); // Run the mdast through the set of plugins

// Check for errors in the messages:
file.messages;
```

You can also use `vfile-reporter` to pretty print the messages for the console.

```typescript
import { fileWarn } from 'myst-utils';

fileWarn(file, 'Replacing \\begin{eqnarray} with \\begin{align*}', {
  node,
  note: 'Although the standard eqnarray environment is available in LaTeX, ...',
  source: 'myst-transforms:math', // colon separated
  url: 'http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf',
});
```
