---
title: Integrating Jupyter based Computation
short_title: Integrating Jupyter
description: blah
thumbnail: thumbnails/integrating-jupyter.png
---

MyST allows you to connect a website directly to a Jupyter Kernel, enabling interactive computation on your page.

This allows you to do some amazing things with your MyST website like:

- Allow readers to recompute your notebooks for themselves, demonstrating the reproducibility of your work
- Provide a new level of interactive content via `ipywidgets` and `ipywidgets` backed libraries such as `ipympl`, `ipyleaflet`, etc...
- Connect to Binder based compute services
- 🚧 Compute using the in-browser `pyodide` WASM kernel (backed by JupyterLite)

```{attention}
Integrated Jupyter Computation is hot off the press and currently limited to pages that represent complete Jupyter notebooks.
We are in active development and this feature should be considered `beta` - please help us out [report any issues that you find](https://github.com/executablebooks/mystjs/issues).

While being able to connect a jupyter based figure or output in any website page to a kernel is still work in progress - but expected very soon. The remainder of the docs below are forward looking, watch for the 🚧 icons on headings what are still work in progress.

```

## Quick setup options

MyST uses `thebe` for Jupyter connectivity which can be enabled using defualt settings by adding a single key (`thebe:true`) to the project frontmatter in your `myst.yml` file.

```{code} yaml
:caption: an example myst.yml file with thebe enabled
version: 1
project:
    title: Geocomputing
    thebe: true
site:
    template: book-theme
    title: My Computational Website
```

When the boolean form of the `thebe` key is used, MyST will try to determine where to connect to from existing `github` and `binder` keys you may have on your project and is intended to allow for easy setup of a few key use cases. To go beyond or override these, you can provide various options in the `thebe` field.

### Case - `thebe:true` and no `github` or `binder` keys are present

```yaml
project:
  thebe: true
```

When `thebe:true` and no `github` or `binder` keys are present MyST will try to connect to a server using the default (local settings). To make this work you'll need to [](#start-a-local-jupyter-server) with the correct defaults or [provide alternative the direct connection options](#directly-connecting-to-a-jupyter-server).

Note this is equivalent to:

```yaml
project:
  thebe:
    server: true
```

### Case - `thebe:true` and the `github` key is present

```yaml
project:
  github: executablebooks/thebe-binder-base
  thebe:
    binder: true
```

When `thebe: true` and the `github` key is present, MyST will attempt to connect to the public `mybinder.org` service using the repository information and a the default `ref: HEAD`. See [](#connecting-to-binder) to point to a different binder service or changing repository details.

Note this is equivalent to:

```yaml
project:
  github: executablebooks/thebe-binder-base
  thebe:
    binder: true
```

### Case - `thebe:true` and the `binder` key is present

```yaml
project:
  binder: https://mybinder.org/v2/gh/executablebooks/thebe-binder-base/HEAD
  thebe: true
```

When `thebe: true` and the `binder` key is present, MyST will use the binder information to establish a connection, the `github` field will be ignored.

Note this is also equivalent to:

```yaml
project:
  binder: https://mybinder.org/v2/gh/executablebooks/thebe-binder-base/HEAD
  thebe:
    binder: true
```

### 🚧 Case - Using Pyodide & JupyterLite

`thebe` can provide access to the pyodide WASM kernel to enable in-browser computation. This uses in browser Jupyter server components deveoped as part of the [JupyterLite project](https://jupyterlite.readthedocs.io/en/latest/) and will be extended in future to provide for different kernels.

The JupyterLite server and `pyodide` kernels can be activated using:

```{code} yaml
:caption: an example myst.yml file with thebe enabled
project:
    thebe:
        lite: true
```

This will load the server using the default options, to learn more about how using JupyterLite can affect site deployment and how environment setup works with pyodide see [](#🚧-integrated-compute-with-pyodide-via-jupyterlite)

### Disabling integrated compute

Easily disable integrated compute on your project by either setting `thebe:false` or removing the key alltogether.

Disable integrated compute on a specific page in your website by adding `thebe:false` to the page frontmatter section.

## Connecting to a Binder

When a the `thebe.binder` key contains a set of options, binder connections are enabled using the provided and default settings descibed below (`github` and `binder` keys at the `project` level are ignored). The most minimal form of configuration is where repository information is provided.

```{code-block} yaml
---
caption: A minimal `thebe.binder` configuration with the required `repo` field
---
project:
  thebe:
    binder:
      repo: executablebooks/thebe-binder-base
```

This allows the repository information for integrated compute to be different to that used for the `github` badge on the website, for useful for example if the github badge is pointing to a organisation or other repo.

```{code-block} yaml
---
caption: A complete `thebe.binder` configuration
---
project:
  thebe:
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
There are now 2 possible locations for `binder` keys our frontmatter. The first at `project.binder` and the second at`project.thebe.binder`.

The first is used to display a "launch binder" badge on your website, while the second is used to provide `thebe` specific settings for integated computation.

When a user presses the "launch binder" badge they will connect to a new independent session, not the same session as established by the integrated compute feature.

```

## Directly connecting to a Jupyter server

When a the `thebe.server` key contains a set of options, direct connections to Juypter use the provided (and default) settings, the most minimal form of configuration is:

```{code-block} yaml
---
caption: minimal configuration for connecting to a local server using default settings
---
project:
  thebe:
    server: true
```

Override the default settings using the following keys:

```{list-table}
:header-rows: 1

* - key
  - description
  - default
* - `url`
  - The base url of the Jupyter server you want to connect to
  - `http://localhost:8888`
* - `token`
  - The token needed to establish a connection
  - `test-secret`
* - `kernelName`
  - The name of the kernel to request when stating a session
  - `python`
```

This allows you to connect to local servers on a different port, or across a private network and provide specific tokens to establish the connection, it is also useful in cases where this information is provided dynamically (for example after a JupyterHub server has been provisioned, however this requires additional infrastruture to deploy).

For more on working locally see [](#start-a-local-jupyter-server).

```{danger} On securing a Jupyter server
:class: dropdown
If you intend to run a dedicate single user Jupyter server accessible over a network please carefully read and follow [the advice provided by the Jupyter server team here](https://jupyter-notebook.readthedocs.io/en/stable/public_server.html).

MyST Websites will work best, be safer and be more robust when backed by Jupyter services such as Binder or JuptyerHub.
```

## 🚧 Integrated compute with pyodide via JupyterLite

The [JupyterLite](https://jupyterlite.readthedocs.io/en/latest/) server and `pyodide` kernels can be activated using:

```{code-block} yaml
---
caption: minimal configuration for enabling JupyterLite
---
project:
    thebe:
        lite: true
```

```{important} TODO
Add the specific list options for custom wheel paths, etc...
```

## Local Development Mode

When working on a MyST site using the `myst-cli`, using a local Jupyter server connection makes a lot of sense and speeds up development. The `local` key allows you to enable and configure a local environment without having to change the other (remote) settings in your `myst.yml` file that will be used in your final deployment.

Local development using can be enabled by simply adding the `local` key, which will use default server options.

```yaml
---
caption: minimal configuration of a local development connection
---
project:
  github: https://github.com/executablebooks/thebe-binder-base
    thebe:
        binder: true
        local: true
```

Further configure the `local` connection using the following options.

```{list-table}
:header-rows: 1

* - `key`
  - desciption
  - default
* - `url`
  - The base url of the Jupyter server you want to connect to
  - `http://localhost:8888`
* - `token`
  - The token needed to establish a connection
  - `test-secret`

```

### Start a local Jupyter server

In addition to how you might normally start a JupyterLab session, it's necessary to provide two additional command line options, as follows.

```{code} bash
jupyter lab --NotebookApp.token=test-secret --NotebookApp.allow_origin='*'
```

The command above is fine for local development and the `token` used should align with that provided in the `project.thebe.token` key.

When starting a local Jupyter server for use with MyST it's also important to understand your computational environment and ensure that the Jupyter instance has access to that with the dependencies it needs to run. This is acheived by following normal best practices for reproducible environment configuration, if you're not familiar with these see [REES](https://repo2docker.readthedocs.io/en/latest/specification.html).

## Reference

### Complete options schema

```{code-block} yaml
project:
  thebe: undefined(false) | boolean | object
    lite: boolean
    binder: undefined(false) | boolean | object
      url: string (url)
      repo: string (org-name/repo-name)
      ref: string (valid git refs only?)
      provider: string (git | gitlab | github)
    server:  undefined(false) | boolean | object
      url: string (url)
      token: string (any)
    kernelName: string (any)
    sessionSaving: boolean (default: true)
    mathjaxUrl: string (url)
    mathjaxConfig: string (any)
    local: undefined(false) | boolean | object
      url: string (url)
      token: string (any)
      kernelName: string (any)
```

### Additional options

```{list-table}
:header-rows: 1

* - `key`
  - desciption
  - default
* - `kernelName`
  - The name of the kernel to request when stating a session
  - `python`
* - `sessionSaving`
  - When `true` any server settings received from `binder` will be cached in local storage. On page refresh or future page load the save session info will be used provided the session is still activate and the max age (86400s) has not been exceeded
  - `true`
* - `mathjaxUrl`
  - Allows the default mathjax bindle loaded by the Juptyer Latex Typesetter to be changed
  - Mathjax 2.7.5 from `cdnjs.cloudflare`[^mathjax]
* - `mathjaxConfig`
  - Allows the default mathjax configuration string to be changed
  - `TeX-AMS_CHTML-full,Safe`
```

[^mathjax]: `https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js`
