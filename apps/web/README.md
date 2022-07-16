# Curvespace

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/curvenote/curvespace/blob/main/LICENSE)
![CI](https://github.com/curvenote/curvespace/workflows/CI/badge.svg)

Curvespace is designed for modern technical communication that is interactive, computational, and linked to data. You can create and serve a local website to write your documentation, paper, thesis, or blog.

- [Curvenote CLI Docs](https://curvenote.com/docs/cli)
- [`curvenote`](https://github.com/curvenote/curvenote/blob/main/apps/cli)

## Development

To run your app locally, make sure your project's local dependencies are installed:

```sh
npm install
```

Afterwards, start the development server like so:

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

## Architecture

Curvespace uses [Remix](https://remix.run) for the server, to learn more see the [Remix Docs](https://remix.run/docs).
We have chosen Remix as it is blazing fast, built on web-standards, and can also work without Javascript.

## Using the Site

This site is run by `curvenote start` see [documentation](https://curvenote.com/docs/web).
