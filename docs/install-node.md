---
title: Install NodeJS
subject: Advanced Installation
subtitle: Install the NodeJS runtime that powers MyST
description: The MyST Command Line Interface (CLI) is built on NodeJS, a JavaScript runtime that is widely used in many projects including well-known Python projects such as Jupyter Lab. MyST can be installed by the package manager npm, PyPI, Conda or Mamba.
---

The MyST Command Line Interface (CLI) is built on [NodeJS](https://nodejs.org/en/about) (`node`), a JavaScript runtime that is widely used in many projects including well-known Python projects such as Jupyter Lab. `node` comes with its own package manager called `npm`.

There are a number of ways to install `node` and you can choose one that is suitable depending on your platform and preferences.

:::{important} Node Versions

MyST currently supports `node` v22+. Note that odd-numbered releases of `node` are not long-lived and you should prefer even-numbered releases when installing (see [Node release schedule](https://nodejs.org/en/about/previous-releases)).
:::

Following any of the install methods below, verify your installation and ensure that `node` and `npm` are available on your system _PATH_ by opening a new terminal window or command line prompt and typing:

```shell
% node -v
vX.Y.Z
```

## Manual Installation (all platforms)

You can download an appropriate installer package for your platform by visiting <https://nodejs.org/>. _LTS_ refers to the current _Long Term Support_ version of `nodejs` and is the best choice for use with MyST.

Download the installer package, and follow instructions to execute the installer for your platform. The installer will automatically add `node` and `npm` to your system PATH.

🛠️ Next, up [Installing MyST](./installing.md)

## `node` via `conda` / `mamba` (all platforms)

`nodejs` is available as a package on `conda-forge`, although a limited number of versions are available on that channel. If you are a `conda` user, installation is straightforward but please note that MyST requires even-numbered node versions, and odd-numbered releases can be found on `conda-forge`.

🛠️ The following command can be used to lock down the version you are installing, adjust as necessary for the even-numbered version you are targeting:

```shell
(my-conda-env)% conda install -c conda-forge 'nodejs=24.*'
(my-conda-env)% node -v
v24.YY.Z
```

💡 Alternatively, you can create a new `conda` environment directly as a `node` environment:

```shell
% conda create -yn my-node-env 'nodejs>=20,<21'
% ....
#
# To activate this environment, use
#
#     $ conda activate my-node-env
#
# To deactivate an active environment, use
#
#     $ conda deactivate
```

🛠️ Next, up [Installing MyST](./installing.md)

## `nodeenv` via pip (all platforms)

`nodeenv` is a python package allowing you to create and manage `node` installations on your system via virtual environments. If you want to work in virtual environments for `node` alongside your python `virtualenv` this is the way to go.

🛠️ Install `nodeenv`\:

```shell
% pip install nodeenv
```

🛠️ Query available node versions:

```shell
% nodeenv --list
% ... XX.YY.Z ...
```

🛠️ Create a new environment based on a specific `node` version, and activate it:

```shell
% nodeenv -n XX.YY.Z node_env
% . node_env/bin/activate
(node_env) % node -v
vXX.YY.Z
```

Read more about `nodeenv` in [their docs](https://ekalinin.github.io/nodeenv/).

🛠️ Next, up [Installing MyST](./installing.md)

## Node Version Manager - Linux/MacOS (`nvm`)

`nvm` is a convenient way to manage multiple node installations on a POSIX compatible system.

🛠️ Install `nvm` using the install script ([docs](https://github.com/nvm-sh/nvm#installing-and-updating)):

```shell
% curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
% nvm -v
0.40.8
```

💡 Note: on MacOS you can also install `nvm` via `brew`

🛠️ Next, install an initial (default) version of `node`\:

```shell
% nvm install 24
Downloading and installing node v24.YY.Z...
...
Now using node v24.YY.Z (npm vXX.YY.Z
%
```

Read more about `nvm` in [their docs](https://github.com/nvm-sh/nvm).
