---
title: Execute Notebooks during your build
description: MyST can execute notebooks using Jupyter Server, making it possible to build rich websites and documents from text-based notebooks.
short_title: Execute Notebooks During Your Build
thumbnail: thumbnails/execute-notebooks.png
---

:::{warning} MyST Execution is in Beta
By default, execution is disabled and code outputs are only inserted if the notebook has already been executed (for text-based notebooks, there are no outputs).
We are adding support for executing markdown notebooks and ipynb files, including inline execution.
As we are adding this functionality we appreciate any feedback from the community on how it is working in your environments. Please add [issues](https://github.com/executablebooks/MyST/issues/new) or join [Discord](https://discord.MyST.org/) to give feedback.
:::

The MyST CLI can execute your notebooks and markdown files by passing the `--execute` flag to the `start` and `build` commands, i.e.:

```bash
myst start --execute
myst build --execute
```

The following computational content will be executed:

- **Notebook cells** will be executed in the order they appeared in a notebook (ie, a file ending in `.ipynb`).
- **`{code-block}` directives** will be executed similar to a code block cell. See [](./notebooks-with-markdown.md) for more information.
- **Inline expressions with the `{eval}` role** can be used to insert the outputs of a computation in-line with other text.

:::{note} Jupyter is required for execution
In order to execute your MyST content, you must install a Jupyter Server and the kernel needed to execute your code (e.g., the [IPython kernel](https://ipython.readthedocs.io/en/stable/), the [Xeus Python kernel](https://github.com/jupyter-xeus/xeus-python), or the [IRKernel](https://irkernel.github.io/).)
:::

## Cache execution outputs

When MyST executes your notebook, it will store the outputs in a cache in a folder called `execute/` in your MyST build folder.
On subsequent builds, MyST will re-use this cache rather than re-execute.

If you change the computational content of a notebook or a markdown page (ie, code in a code cell, or in an inline expression), then this cache will be reset and the code will be re-executed at the next build.

### Force execution by deleting the cache

If you'd like to force re-execution of all the code in your MyST documents, use the following command:

```bash
myst clean --execute
```

Alternatively, you can manually delete the `execute/` folder in your build folder, e.g.:

```bash
rm -rf _build/execute
```

## How MyST executes your code

MyST uses a [Jupyter Server](https://jupyter-server.readthedocs.io/) to execute your code.
Jupyter Server is distributed as a Python package, which can be installed from PyPI or conda-forge, e.g.

```bash
pip install jupyter-server
```
Jupyter Server is only responsible for orchestrating execution of your code. To actually perform execution, you must also install a kernel. For Python, this might be `ipykernel`, e.g.

```bash
pip install ipykernel
```

If Jupyter Server is installed and the `--execute` flag is passed to `myst start` or `myst build`, then MyST will attempt to find a healthy existing Jupyter Server. Internally, this is performed using `python -m jupyter_server list`. If no existing servers are found, then MyST will attempt to launch one using `python -m jupyter_server`.


## Manually launch a Jupyter server

Advanced users may wish to connect to non-local Jupyter Servers, e.g. those running on a remote server. It is possible to instruct MyST to connect to a remote server by setting the `JUPYTER_BASE_URL` and `JUPYTER_TOKEN` environment variables, e.g.
```bash
# Set local environment variable
port="8888"

# Setup environment variables used by MyST
export JUPYTER_BASE_URL="http://localhost:${port}"
export JUPYTER_TOKEN="my-jupyter-token"

# Start server in the background
jupyter server --IdentityProvider.token="${JUPYTER_TOKEN}" --ServerApp.port="${port}" &

# Run MyST
myst build --execute

# Stop server!
kill %1
```
