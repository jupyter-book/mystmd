## Developer Install

For installing the package locally, you will need [node](https://nodejs.org/) and [npm](https://docs.npmjs.com/about-npm), both can use a global install on your system.

Once you have `npm` installed globally, navigate into this project folder and install the dependencies:

```bash
cd mystjs
npm install
npm run start  # Start a development server to play with the library! 🚀
```

## package.json scripts

The scripts for building, testing, and serving the project are in the [package.json](package.json), the main ones to use are `npm run test`, `npm run build`, and `npm run start`.

The command `npm run build` builds the library, including compiling the typescript and bundling/minification to create `myst.min.js`.
This outputs to the `dist` folder, and also includes all type definitions (`*.d.ts`).

The command `npm run test` runs the tests, these are mostly based on the [fixtures](fixtures) folder. You can also use `npm run test:watch` to run on any file changes.

The command `npm run start` starts a server for manually testing and playing with `mystjs`, this uses a in-memory bundle of what would go in the `dist` folder.
Note that this does not actually build the library!

## Typescript

`mystjs` uses Typescript in `strict` mode and `noImplicitAny`. The types are distributed with the package.

## Build Targets

The package create a `dist` folder and transpiles all code from Typescript to Javascript.
The main library can run in both the browser and in node, however, another file `myst.ts` is
used to attached the global `MyST` variable to the `window`. This file `myst.min.js`
is what should be distributed when using scripts in HTML.

Otherwise you should be using standard imports or requires in your node environment.
