---
title: Develop a MyST Web Theme
description: Metadata, engine interfaces, and registration steps for custom MyST web themes.
---

This document is relevant for people building or shipping a new MyST web theme (similar to the React/Remix apps behind `book-theme`, `article-theme`, etc).
It describes what the MyST engine expects today, with links to relevant source code.

:::{warning}
This document tracks the current implementation and is in progress.
Details may change soon.
See this MEP for a discussion of changing terminology around themes: https://github.com/jupyter-book/myst-enhancement-proposals/pull/37
:::

## Architecture in brief

The MyST engine runs the content pipeline, while the theme is a web server that renders that content.
Specifically:

- When you run `myst start`, the engine builds `_build/site` (content JSON, config, assets), serves it on `CONTENT_CDN_PORT`, and launches your theme with the template’s `build.start` command.
- A theme should read `_build/site/config.json` first, fetch page JSON from `/content/{slug}.json`, and serve the app on `PORT` (Remix/Vite/Next-style).

Live reloads are facilitated by a websocket endpoint at `/socket`, which processes JSON messages. Static assets, and template options with type `file` are copied into `_build/site/public` and served from `/`.

## Theme metadata (`template.yml`)

- Your `template.yml` must declare `myst: v1` and `kind: site`, plus human metadata like `title`, `description`, `version`, `license`, `authors`, `tags`, `source/github`, and `thumbnail` (see [validators.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-templates/src/validators.ts)).
- Static assets used by the theme should be listed in `files`, and the main compiled entry can override the default as `template` (optional; defaults to `template` in the archive); both must exist in the archive and are copied alongside the build.
- `tags` are surfaced by the templates API for discovery but are not consumed by the engine; use them to help users find your theme.
- Runtime hooks live in `build`: `install` runs once before start (defaults to `npm install`), and `start` runs your theme with the content server available (defaults to `npm run start`; see [template.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/site/template.ts)).
- User options live in `options`/`parts`/`doc` (defined in [types.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-templates/src/types.ts)); `file` options are copied into `_build/site/public` before being handed to the theme (see [manifest.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/site/manifest.ts)).

See the book theme [`template.yml`](https://github.com/jupyter-book/myst-theme/blob/main/themes/book/template.yml) for a detailed example.

## Engine and theme APIs

During `myst start` the engine resolves/downloads your template (default `book-theme`), validates it as a `site` template, and installs dependencies if needed ([template.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/site/template.ts)).
It then produces `_build/site/config.json`, validates it against your `doc`/`options`, and copies any `file` options into `_build/site/public` ([manifest.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/site/manifest.ts)).
The content server provides these entry points (from [start.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/site/start.ts)):
- `/config.json` (see [types.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-config/src/site/types.ts)).
- `/content/{slug}.json` payloads (see [crossReferences.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/crossReferences.ts)); when the browser requests `/slug`, your theme should fetch `/content/{slug}.json` (and `/content/index.json` for `/`).
- Reference and search files at `/objects.inv`, `/myst.xref.json`, `/myst.search.json`.
- Static assets from `/` and a `/socket` websocket for `LOG` and `RELOAD` events.
Your start script receives `HOST`, `CONTENT_CDN_PORT`, `PORT`, `MODE` (`app` or `static`), and optional `BASE_URL`; any framework or server is fine as long as it reads these and fetches content from the endpoints above.

## Register your theme

1. Package the built theme so the archive root contains `template.yml`, compiled assets, and any files listed in `files`/`template` (see [download.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-templates/src/download.ts)).
2. Publish that bundle to a stable zip or git URL and add it to the [`myst-templates/templates`](https://github.com/myst-templates/templates) index with `kind: site` and a `links.download` entry; the MyST API (`https://api.mystmd.org/templates/site/...`) serves that metadata to the CLI when resolving themes (also in [download.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-templates/src/download.ts)).
3. Test registration by calling the API (`GET https://api.mystmd.org/templates/site`) or by pointing `site.template` at your name or path and running `myst start` or `myst build --site`.
