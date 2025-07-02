---
title: In-Browser Execution
subtitle: Connecting Jupyter Kernels to your MyST website
description: MyST allows you to connect a website directly to a Jupyter Kernel, enabling interactive computation on your page.
thumbnail: thumbnails/integrating-jupyter.png
aliases:
  - integrating-jupyter
---

In-browser execution allows you to connect a live Jupyter kernel to your website, allowing you to add interactive visualizations and interactivity that is powered with a live kernel. This allows your readers to reproduce the outputs of your document in real-time, and to add more complex interactive content via tools like [`ipywidgets`](https://ipywidgets.readthedocs.io/) or [Panel](https://github.com/holoviz/panel).

There are a variety of back-ends that can provide the computation for in-browser execution, such as **Binder**, **Standalone Jupyter Servers**, or **WASM-based kernels from JupyterLite**. See [](#thebe-backend-options) for more information.

```{attention} This is a beta feature
We are in active development and this feature should be considered `beta` - please help us out [report any issues that you find](https://github.com/jupyter-book/mystmd/issues).

Watch for the 🚧 icons on headings that are still work in progress.
```

## Enable in-browser computation

To enable in-browser computation, use the `project.jupyter: true` parameter like so:

```{code} yaml
:filename: myst.yml
version: 1
project:
  jupyter: true
```

By default, MyST will use [mybinder.org](https://mybinder.org) to build and provide the environment for computation. It will use the [`thebe-binder-base` repository](https://github.com/executablebooks/thebe-binder-base) to build the environment. If you have a GitHub repository defined for your project via `project.github`, then it will use that instead.

### Launch in-browser execution

To launch in-browser execution on the page, press the "power" button at the top of the page content.

This will launch a Binder session (or, [connect to a live Jupyter server](#thebe-jupyter-server) based on your configuration). If you launch a Binder server, you'll see a box in the bottom-right of the page showing the status of Binder launching your session.

You'll know that execution is now available when the in-browser execution panel is visible at the top of the page. It looks like this:

```{figure} ./images/thebe-control-panel.png
This panel allows you to control the execution on the current page.
```

In addition, all cells on the page will execute when the server is available.

### Launch into the interactive Jupyter server

To change the browser window to the fully interactive Jupyter server that is powering your computation, click the "Launch Jupyter Server Window" button to the right of the in-browser execution panel.

```{figure} ./images/thebe-control-panel.png
The right-most button will take you to the fully interactive Jupyter Server.
```

## Binder configuration options

By default, in-browser computation uses a BinderHub service to provide computation.

### Options for Binder configuration

```{list-table}
:header-rows: 1

* - key
  - required?
  - description
  - default
* - `repo`
  - required
  - The repository to use as a base image for your Jupyter server as a `owner/reponame` string or a fully qualified url. See [](#binder-option-repository).
  - `executablebooks/thebe-binder-base`
* - `ref`
  - optional
  - The git ref to use from the repository, allow you to target a specific branch, tag or commit. See [](#binder-option-branch).
  - `HEAD`
* - `url`
  - optional
  - The base url of the binder service to connect to. See [](#binder-option-service).
  - `mybinder.org`
* - `provider`
  - optional
  - Tells `thebe` how to form urls for requesting binder services. Can be one of `github`, `gitlab` or `git`. See [](#binder-option-repoprovider).
  - `github`
```

```{attention} Be aware of multiple keys
There are two possible locations for `binder` keys:

1. `project.binder` is for [launch button configuration](./website-launch-buttons.md), and will take the user to a new page with a Binder session.
2. `project.jupyter.binder` is for in-browser computation described here.
```

(binder-option-repository)=
### Choose the repository for your kernel environment

To choose the repository that is used for your kernel, use the `project.jupyter.binder.repo` key. Here's an example:

```{code} yaml
:filename: myst.yml
project:
  jupyter:
    binder:
      repo: https://github.com/binder-examples/requirements # default repo
```

By default, MyST will use the `HEAD` of the repository, which usually corresponds to the `main` branch. To choose a different branch, see [](#in-browser-computation-choose-branch).

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

(binder-option-branch)=

### Choose a branch or ref for your environment

To choose a branch or git ref other than the default (`HEAD`), use the `ref` key like so:

```{code} yaml
---
filename: myst.yml
caption: A complete `thebe.binder` configuration
---
project:
  jupyter:
    binder:
      # ref can be the name of a branch or a commit hash
      ref: my-branch
```

(binder-option-service)=

### Choose the BinderHub service for computation

To choose a BinderHub service other than [mybinder.org](https://mybinder.org), use configuration like so:

```{code} yaml
---
filename: myst.yml
caption: A complete `thebe.binder` configuration
---
project:
  jupyter:
    binder:
      # The URL parameter controls the BinderHub serviec to use.
      url: https://binder.myorganisation.com/services/binder/
```

(binder-option-repoprovider)=

### Choose a repository provider other than GitHub

To choose a git repository provider other than GitHub, use the `provider` key like so:

```{code} yaml
---
filename: myst.yml
caption: A complete `thebe.binder` configuration
---
project:
  jupyter:
    binder:
      # See below for a list of available providers
      provider: gitlab
```

### Configure my Binder repository environment

See [the Binder documentation](https://docs.mybinder.org) for instructions on how to set up your repository to have the environment you need. Binder uses the [Reproducible Execution Environment Specification](https://repo2docker.readthedocs.io/en/latest/specification.html) to turn repository contents into a reproducible environment.

(thebe-jupyter-server)=

## Use a local or remote Jupyter server for in-browser execution

If you have access to a Jupyter server that is already running (for example, by starting a server locally, or accessing a server via a JupyterHub), you can use this to provide in-browser computation instead of Binder.

To use a server that is already running locally, use the `jupyter.server` key like so:

```{code-block} yaml
---
filename: myst.yml
caption: A unique connection token must be supplied to connect to a local server
---
project:
  jupyter:
    server:
      url: http://localhost:8888/
      token: <your-secret-token>
```

```{list-table}
:header-rows: 1
:caption: The configuration options and their defaults for local kernel computation.

* - key
  - description
  - default
* - `url`
  - The base url of the Jupyter server you want to connect to
  - `http://localhost:8888`
* - `token`
  - The secret token string required by your Jupyter server
```

(start-a-local-jupyter-server)=

### Start a local Jupyter server for in-browser computation

In addition to how you might normally start a JupyterLab session, it's necessary to provide two additional command line options, as follows.

```{code} bash
jupyter lab --NotebookApp.token=<your-secret-token> --NotebookApp.allow_origin='http://localhost:3000'
```

The command above is fine for local development. The `token` used should align with that provided in the `project.thebe.token` key and `allow_origin` should allow connections from your myst site preview, usually running on `http://localhost:3000`.

When starting a local Jupyter server for use with MyST it's also important to understand your computational environment and ensure that the Jupyter instance has access to that with the dependencies it needs to run. This is achieved by following normal best practices for reproducible environment configuration, if you're not familiar with these see [REES](https://repo2docker.readthedocs.io/en/latest/specification.html).

```{danger} Securing a Jupyter server
:class: dropdown
If you intend to run a dedicated single user Jupyter server accessible over a network please carefully read and follow [the advice provided by the Jupyter server team here](https://jupyter-server.readthedocs.io/en/stable/operators/security.html).

MyST Websites will work best, be safer and be more robust when backed by Jupyter services such as BinderHub or JupyterHub.
```

(jupyterlite)=

## Use JupyterLite and WebAssembly for in-browser computation

The [JupyterLite project](https://jupyterlite.readthedocs.io/en/latest/) allows you to ship a lightweight computational environment that runs fully in your browser. To use JupyterLite for your in-browser computation, use the configuration below:

```{code} yaml
project:
  jupyter:
    lite: true
```

This will load the server using the default environment described in the [JupyterLite docs](https://jupyterlite.readthedocs.io/en/latest/). For more configuration options with JupyterLite, see [](#jupyterlite).

```{important} TODO
Add the specific list options for custom wheel paths, etc.
```


## Enable or disable in-browser computation on a single page

To configure in-browser computation on a single page, use [document frontmatter](./frontmatter.md). For example:

To **enable in-browser computation on a single page**, use configuration like so:

```{code} markdown
:filename: mypage.ipynb
---
jupyter:
  binder:
    # If you had one page that needed an R kernel
    repo: https://github.com/binder-examples/r
---

My page content.
```

To **disable in-browser computation on a single page**, use configuration like so:

```{code} markdown
:filename: mypage.md
---
jupyter: false
---

My page content.
```

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

The following keys can all be used under the `project.jupyter` configuration.

```{list-table}
:header-rows: 1

* - `key`
  - description
  - default
* - `kernelName`
  - The name of the kernel to request when starting a session
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
