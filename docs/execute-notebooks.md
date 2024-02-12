---
title: Execute Notebooks with Jupyter
description: MyST can execute notebooks using Jupyter Server, making it possible to build rich websites and documents from text-based notebooks.
thumbnail: thumbnails/execute-notebooks.png
---

## Overview

:::{warning} MyST Execution is in Beta
We are adding support for executing markdown notebooks and ipynb files, including inline execution. As we are adding this functionality we appreciate any feedback from the community on how it is working in your environments. Please add [issues](https://github.com/executablebooks/MyST/issues/new) or join [Discord](https://discord.MyST.org/) to give feedback.
:::

The MyST CLI can execute your notebooks and markdown files by passing the `--execute` flag to the `start` and `build` commands, i.e.:

```bash
myst start --execute
myst build --execute
```

If the flag is passed, notebook cells and inline execution will be executed and the original notebook values ignored. By default, execution is disabled and will use the notebook outputs already saved in the notebook (for text-based notebooks, there are no outputs). The notebook outputs are cached based on the source to allow for speedy editing workflows of text without having to re-execute your notebooks. 

## Launching a Server

MyST performs execution of notebooks by communication with a Jupyter Server. Jupyter Server is distributed as a Python package, which can be installed from PyPI or conda-forge, e.g.
```bash
pip install jupyter-server
```
Jupyter Server is only responsible for orchestrating execution of your code. To actually perform execution, you must also install a kernel. For Python, this might be `ipykernel`, e.g.
```bash
pip install ipykernel
```

If Jupyter Server is installed and the `--execute` flag is passed to `myst start` or `myst build`, then MyST will attempt to find a healthy existing Jupyter Server. Internally, this is performed using `python -m jupyter_server list`. If no existing servers are found, then MyST will attempt to launch one using `python -m jupyter_server`.

:::{note}
Advanced users may wish to connect to non-local Jupyter Servers, e.g. those running on a remote server. It is possible to instruct MyST to connect to a remote server by setting the `JUPYTER_BASE_URL` and `JUPYTER_TOKEN` environment variables.
:::

## Caching Outputs

By default MyST caches the execution of a notebook according to its executable content. In simple terms, this means that MyST avoids re-running a kernel over a notebook if the notebook's code and inline-expressions do not change. This may not always be correct; if the execution environment (e.g. installed Python packages) changes, you may wish to re-run the notebook. For now, you can clear the execution cache with
```bash
myst clean --execute
```
