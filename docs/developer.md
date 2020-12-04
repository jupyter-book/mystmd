# Developer Install

For installing the package locally, we suggest [Yarn](https://yarnpkg.com/), which can be installed using these [instructions](https://yarnpkg.com/getting-started/install), you will need [node](https://nodejs.org/), both can use a global install on your system.

Once you have `yarn` installed globally, navigate into this project folder and install the dependencies:

```bash
cd markdown-it-myst
yarn install
yarn start  # Start a development server to play with the library! 🚀
```

## package.json scripts

The scripts for building, testing, and serving the project are in the `package.json`, the main ones to use are:
* `yarn test`
* `yarn build`
* `yarn start`

### `yarn build`
Builds the library, including compiling the typescript and bundling/minification to create `myst.min.js`.
This outputs to the `dist` folder, and also includes all type definitions (`*.d.ts`).

### `yarn test`
Run the tests, these are mostly based on the `fixtures` folder. You can also use `yarn test:watch` to re-run the tests on any file changes.

### `yarn start`
Starts a server for manually testing and playing with `markdown-it-myst`, this uses a in-memory bundle of what would go in the `dist` folder. Note that this does not actually build the library!

## Typescript
`markdown-it-myst` uses Typescript in `strict` mode and `noImplicitAny`. The types are distributed with the package.

## Build Targets
The package create a `dist` folder and transpiles all code from Typescript to Javascript.
The main library can run in both the browser and in node, however, another file `myst.ts` is
used to attached the global `MyST` variable to the `window`. This file `myst.min.js`
is what should be distributed when using scripts in HTML.

Otherwise you should be using standard imports or requires in your node environment.
