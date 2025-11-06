---
title: Package and distribute plugins
description: Share your custom plugins so that others can use them.
---

There is no "official" way to distribute MyST plugins. However, you can use common workflows in the JavaScript ecosystem to distribute your plugins so that others can use them. This page documents a few of them.
## Distribute plugins as a single `.mjs` file if they have no dependencies

If your plugin doesn't require any extra dependencies, then you can distributed it as a single `.mjs` file written in JavaScript. You can then use it locally or [distribute it via a URL](#plugin:distribute-url).

See [](./javascript-plugins.md) for several example plugins written as individual `.mjs` files with no dependencies.

## Package plugins into a single ESM file if they have dependencies

If your plugin has other dependencies that it needs to package with the plugin, you can do so using the [ECMAScript Modules standard](https://nodejs.org/api/esm.html) for packaging and distributing JavaScript. The sections below describe how to do so.

## Use a builder to build an ESM package

There are several "builders" in the JavaScript ecosystem that make it easy to quickly bundle JavaScript in distributable packages. The resulting artifact can then be shared directly, or published to a package registry like [NPM](https://npmjs.com).

We recommend [`esbuild`](https://esbuild.github.io/).

:::{note} Example: Bundle a custom plugin with `esbuild`
The [`js-plugin` MyST example](https://github.com/myst-examples/js-plugin) demonstrates how to use `esbuild` to bundle a plugin and its dependencies into a single file. It uses GitHub releases to make the file available at a URL. See the [project README](https://github.com/jupyter-book/example-js-plugin?tab=readme-ov-file#myst-js-plugin) for more details.
:::

:::{note} Example: Share a simple plugin without a build tool
If your plugin is simple enough, you can directly share it as an ESM bundle rather than needing a builder like `esbuild`. [Here is a an example of a simple plugin](https://github.com/myst-ext/myst-ext-lorem) that generates Lorem Ipsum text. It does not require a separate build tool.
:::

### Other JavaScript bundlers

There are a few other bundlers in the JavaScript ecosystem, which you may use to package MyST plugins if you prefer. We share them in case you don't want to use `esbuild` for some reason (but for most people, `esbuild` should be just fine).

* [tsup](https://github.com/egoist/tsup) - [example plugin](https://github.com/myst-ext/myst-ext-discourse)
* [ncc](https://github.com/vercel/ncc) - [example plugin](https://github.com/myst-ext/myst-ext-xref-prefix/blob/e975496cafa57e86c88ea71d3abe26a7174b3944/package.json#L20) 

(plugin:distribute-url)=
## Distribute your plugin via a URL

The easiest way to distribute your plugin is via an accessible URL that points to the bundled file that you've created.
Then you can [configure `myst.yml` to use the URL in your plugin](#plugins:use).

For example, you can [use GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) to publish your built plugin as an artifact attached to a release. This will create a persistent URL that you can point to in your `myst.yml` build.
