---
title: In-Browser Execution
subtitle: Connecting Jupyter Kernels to your MyST website
description: MyST allows you to connect a website directly to a Jupyter Kernel, enabling interactive computation on your page.
thumbnail: thumbnails/integrating-jupyter.png
---

MyST allows you to connect a website directly to a Jupyter Kernel, allowing you to do some amazing things with your website like:

- Allow readers to recompute your notebooks for themselves, demonstrating the reproducibility of your work
- Provide a new level of interactive content via `ipywidgets` and `ipywidgets` backed libraries such as `ipympl`, `ipyleaflet`, etc...
- Connect to Binder based compute services
- 🚧 Compute using the in-browser `pyodide` WASM kernel (backed by JupyterLite)

```{attention}
Integrated Jupyter Computation is hot off the press and currently limited to pages that represent complete Jupyter notebooks.
We are in active development and this feature should be considered `beta` - please help us out [report any issues that you find](https://github.com/jupyter-book/mystmd/issues).

Being able to connect a Jupyter-based figure or output in any website page to a kernel is still work in progress - but expected very soon. The remainder of the docs below are forward looking, watch for the 🚧 icons on headings that are still work in progress.
```

## Quick setup options

MyST uses `thebe` for Jupyter connectivity which can be enabled using default settings by adding a single key `jupyter: true` (or `thebe: true`) to the project frontmatter in your `myst.yml` file.

```{code} yaml
version: 1
project:
  title: Geocomputing
  jupyter: true
site:
  template: book-theme
  title: My Computational Website
```

When the field `jupyter: true` is set, MyST will try to determine where to connect to automatically by looking at the `github` field if you supplied one. Otherwise it will use the demo repository at `https://github.com/executablebooks/thebe-binder-base` along with [mybinder.org](https://mybinder.org) to start a Jupyter environment.

The intention here is to allow minimal setup to enable a few key use cases. To go beyond or override these, you can provide various options in the `jupyter` field which are documented below.

````{tip} Equivalent Syntax
:class: dropdown
The following cases are all equivalent:

```yaml
project:
  jupyter: true
```

```yaml
project:
  jupyter: 'binder'
```

```yaml
project:
  jupyter:
    binder: true
```

```yaml
project:
  jupyter:
    binder:
      repo: executablebooks/thebe-binder-base # default repo
```

```yaml
project:
  jupyter:
    binder:
      repo: https://github.com/executablebooks/thebe-binder-base # default repo
```

````

## Jupyter Configuration Options

The following "cases" show different configuration options, aimed at different use cases. Look through these to find one that suits you purpose.

### Case connect to binder with my own repo

_`jupyter: true` and the `github` key is present_

```yaml
project:
  github: https://github.com/username/my-myst-article
  jupyter: 'binder'
```

When `jupyter: true` and the `github` key is present, MyST will attempt to connect to the public `mybinder.org` service using the repository information and a the default `ref: HEAD`. See [](#connecting-to-a-binder) to point to a different binder service or changing repository details.

````{tip} Equivalent Syntax
:class: dropdown
The following cases are all equivalent:

```yaml
project:
  github: https://github.com/username/my-myst-article
  jupyter: 'binder'
```

```yaml
project:
  github: https://github.com/username/my-myst-article
  jupyter: true
```

```yaml
project:
  github: https://github.com/username/my-myst-article
  jupyter:
    binder: true
```

````

### 🚧 Case - Using Pyodide & JupyterLite

`thebe` can provide access to the pyodide WASM kernel to enable in-browser computation. This uses in browser Jupyter server components developed as part of the [JupyterLite project](https://jupyterlite.readthedocs.io/en/latest/) and will be extended in future to provide for different kernels.

The JupyterLite server and `pyodide` kernels can be activated using:

```{code} yaml
project:
  jupyter:
    lite: true
```

This will load the server using the default options, to learn more about how using JupyterLite can affect site deployment and how environment setup works with pyodide see [](#jupyterlite)

````{tip} Equivalent Syntax
:class: dropdown
The following cases are all equivalent:

```{code} yaml
project:
  jupyter:
    lite: true
```

````

### Disabling integrated compute

Easily disable integrated compute on your project by either setting `jupyter: false` or removing the key altogether.

Disable integrated compute on a specific page in your website by adding `jupyter: false` to the page frontmatter section.

(connecting-to-a-binder)=

## Connecting to a Binder

When a the `thebe.binder` key contains a set of options, binder connections are enabled using the provided and default settings described below (`github` and `binder` keys at the `project` level are ignored). The most minimal form of configuration is where repository information is provided.

```{code-block} yaml
---
caption: A minimal `thebe.binder` configuration with the required `repo` field
---
project:
  jupyter:
    binder:
      repo: username/my-myst-article
```

This allows the repository information for integrated compute to be different to that used for the `github` badge on the website, for useful for example if the github badge is pointing to a organization or other repo.

```{code-block} yaml
---
caption: A complete `thebe.binder` configuration
---
project:
  jupyter:
    binder:
      url: https://binder.myorganisation.com/services/binder/
      repo: executablebooks/thebe-binder-base
      ref: main
      provider: gitlab
```

```{list-table}
:header-rows: 1

* - key
  - required?
  - description
  - default
* - `repo`
  - required
  - The repository to use as a base image for your Jupyter server as a `owner/reponame` string or a fully qualified url
  - `executablebooks/thebe-binder-base`
* - `url`
  - optional
  - The base url of the binder service to connect to
  - `mybinder.org`
* - `ref`
  - optional
  - The git ref to use from the repository, allow you to target a specific branch, tag or commit
  - `HEAD`
* - `provider`
  - optional
  - Tells `thebe` how to form urls for requesting binder services. Can be one of `github`, `gitlab` or `git`.
  - `github`
```

```{tip} Use REES for your environment setup
:class: dropdown
To properly setup you repository for use with `binder` refer to [The Reproducible Execution Environment Specification](https://repo2docker.readthedocs.io/en/latest/specification.html)
```

```{attention} Be aware of multiple keys
:class: dropdown
There are two possible locations for `binder` keys the project frontmatter: `project.binder` and `project.thebe.binder`.

The first is used to display a "launch binder" badge on your website, while the second is used to provide `thebe` specific settings for integrated computation.

When a user presses the "launch binder" badge they will connect to a new independent session, which is not the same session as established by the integrated compute feature.
```

(directly-connecting-to-a-jupyter-server)=

## Directly connecting to a (local) Jupyter server

The `thebe.server` key is used to provide options for direct connections to Jupyter, use the provided (and default) settings, the most minimal form of configuration is:

```{code-block} yaml
---
caption: A unque connection token must be supplied to connect to a local server
---
project:
  jupyter:
    server:
      url: http://localhost:8888/
      token: <your-secret-token>
```

Both `url` and `token` must be provided to enable a server connection.

```{list-table}
:header-rows: 1

* - key
  - description
  - default
* - `url`
  - The base url of the Jupyter server you want to connect to
  - `http://localhost:8888`
* - `token`
  - The secret token string required by your Jupyter server
```

This allows you to connect to local servers on a different port, or across a private network and provide specific tokens to establish the connection, it is also useful in cases where this information is provided dynamically (for example after a JupyterHub server has been provisioned).

For more on working locally see [](#start-a-local-jupyter-server).

```{danger} On securing a Jupyter server
:class: dropdown
If you intend to run a dedicate single user Jupyter server accessible over a network please carefully read and follow [the advice provided by the Jupyter server team here](https://jupyter-server.readthedocs.io/en/stable/operators/security.html).

MyST Websites will work best, be safer and be more robust when backed by Jupyter services such as BinderHub or JupyterHub.
```

(jupyterlite)=

## 🚧 Integrated compute with pyodide via JupyterLite

The [JupyterLite](https://jupyterlite.readthedocs.io/en/latest/) server and `pyodide` kernels can be activated using:

```{code-block} yaml
---
caption: Minimal configuration for enabling JupyterLite
---
project:
  jupyter:
    lite: true
```

```{important} TODO
Add the specific list options for custom wheel paths, etc.
```

(start-a-local-jupyter-server)=

### Start a local Jupyter server for development purposes

In addition to how you might normally start a JupyterLab session, it's necessary to provide two additional command line options, as follows.

```{code} bash
jupyter lab --NotebookApp.token=<your-secret-token> --NotebookApp.allow_origin='http://localhost:3000'
```

The command above is fine for local development. The `token` used should align with that provided in the `project.thebe.token` key and `allow_origin` should allow connections from your myst site preview, usually running on `http://localhost:3000`.

When starting a local Jupyter server for use with MyST it's also important to understand your computational environment and ensure that the Jupyter instance has access to that with the dependencies it needs to run. This is achieved by following normal best practices for reproducible environment configuration, if you're not familiar with these see [REES](https://repo2docker.readthedocs.io/en/latest/specification.html).

## Reference

### Complete options schema

```{code-block} yaml
project:
  jupyter: undefined(false) | boolean | object | 'lite' | 'binder'
    lite: boolean
    binder: undefined(false) | boolean | object
      url: string (url)
      provider: string (git | gitlab | github | or custom)
      repo: string (org-name/repo-name | url | string)
      ref: string (undefined | string)
    server:  undefined | object
      url: string (url)
      token: string (any)
    kernelName: string (any)
    disableSessionSaving: boolean (default: false)
    mathjaxUrl: string (url)
    mathjaxConfig: string (any)
```

### Additional options

```{list-table}
:header-rows: 1

* - `key`
  - description
  - default
* - `kernelName`
  - The name of the kernel to request when stating a session
  - `python`
* - `disableSessionSaving`
  - When `false` (default) any server settings received from `binder` will be cached in local storage. On page refresh or future page load the save session info will be used provided the session is still activate and the max age (86400s) has not been exceeded
  - `false`
* - `mathjaxUrl`
  - Allows the default mathjax bundle loaded by the Jupyter Latex Typesetter to be changed
  - Mathjax 2.7.5 from `cdnjs.cloudflare`[^mathjax]
* - `mathjaxConfig`
  - Allows the default mathjax configuration string to be changed
  - `TeX-AMS_CHTML-full,Safe`
```

[^mathjax]: `https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js`
