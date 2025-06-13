---
title: Package and distribute plugins
description: Share your custom plugins so that others can use them.
---

There is no "official" way to distribute plugins with MyST. However, you can use common workflows in the JavaScript ecosystem to distribute your plugins so that others can use them. This page documents a few approaches that may work.

## Package plugins into a single ESM file 

JavaScript uses the [ECMAScript Modules standard](https://nodejs.org/api/esm.html) for packaging and distributing scripts. Your plugins can be bundled and distributed in the same way.

## Use a builder to build an ESM package

There are several "builders" in the JavaScript ecosystem that make it easy to quickly bundle JavaScript in distributable packages. The resulting artifact can then be shared directly, or published to a package registry like [NPM](https://npmjs.com).

We recommend [using `esbuild`](https://esbuild.github.io/) to accomplish this.

:::{note} Example: Bundle a custom plugin with `esbuild`
The [`js-plugin` MyST example](https://github.com/myst-examples/js-plugin) demonstrates how to use `esbuild` to bundle a plugin and its dependencies into a single file. It uses GitHub releases to make the file available at a URL. See the [project README](https://github.com/jupyter-book/example-js-plugin?tab=readme-ov-file#myst-js-plugin) for more details.
:::

:::{note} Example: Share a simple plugin without a build tool
If your plugin is simple enough, you can directly share it as an ESM bundle rather than needing a builder like `esbuild`. [Here is a an example of a simple plugin](https://github.com/myst-ext/myst-ext-lorem) that generates Lorem Ipsum text. It does not require a separate build tool.
:::

### Other JavaScript bundlers

There are a few other bundlers in the JavaScript ecosystem, which you may use to package MyST plugins if you prefer. Here are a few known bundler options:

* [tsup](https://github.com/egoist/tsup) - [example plugin](https://github.com/myst-ext/myst-ext-discourse)
* [ncc](https://github.com/vercel/ncc) - [example plugin](https://github.com/myst-ext/myst-ext-xref-prefix/blob/e975496cafa57e86c88ea71d3abe26a7174b3944/package.json#L20) 

