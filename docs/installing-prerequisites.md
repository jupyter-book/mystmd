---
title: Installing NodeJS
description: The MyST Command Line Interface (CLI) is built on NodeJS, a Javascript runtime that is widely used in many projects including well-known Python projects such as Jupyter Lab. MyST can be installed by the package manager npm.
---

+++

The MyST Command Line Interface (CLI) is built on [NodeJS](https://nodejs.org/en/about/) (`nodejs`), a Javascript runtime that is widely used in many projects including well-known Python projects such as Jupyter Lab. `node` comes with its own package manager called `npm`.

There are a number of ways to install `nodejs` and you can choose one that is suitable depending on your platform and preferences.

````{important}
**Node Versions**

MyST currently supports `nodejs` v16 and v18. Note that odd-numbered releases of `nodejs` are not long-lived and you should prefer even-numbered releases when installing.
````

Following any of the install methods below, verify your installation and ensure that `node` and `npm` are available on your system *PATH* by opening a new terminal window or command line prompt and typing:

```text
% node -v
v16.15.0
% npm -v
v8.5.0
```

+++

## Manual Installation (all platforms)

You can download an appropriate installer package for your platform by visiting <https://nodejs.org/>. *LTS* refers to the current *Long Term Support* version of `nodejs` and is the best choice for use with MyST.

Download the installer package, and follow instructions to execute the installer for your platform. The installer will automatically add `node` and `npm` to your system PATH.

🛠️ Next, up [Installing MyST](./installing.md)

+++

## `node` via `conda` / `mamba` (all platforms)

`nodejs` is available as a package on `conda-forge`, although a limited number of versions are available on that channel. If you are a `conda` user, installation is straightforward but please note that MyST requires even-numbered node versions, and odd-numbered releases can be found on `conda-forge`.

🛠️ Use the following command can be used to lock down the version you are installing, adjust as necessary for the even-numbered version you are targeting:

```python
(my-conda-env)% conda install -c conda-forge 'nodejs>=16,<17'
(my-conda-env)% node -v
(my-conda-env)% v16.14.2
(my-conda-env)% npm -v
(my-conda-env)% v
```

💡 Alternatively, you can create a new `conda` environment directly as a `node` environment:

```shell
% conda create -yn my-node-env 'nodejs>=16,<17'
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

+++

## `nodeenv` via pip (all platforms)

`nodeenv` is a python package allowing you to create and manage `node` installations on your system via virtual environments. If you want to work in virtual environments for `node` alongside your python `virtualenv` this is the way to go.

🛠️ Install `nodeenv`\:

```python
% pip install nodeenv
```

🛠️ Query available node versions:

```python
% nodeenv --list
% ... 16.15.0 ...
```

🛠️ Create a new environment based on a specific `node` version, and activate it:

```shell
% nodeenv -n 16.15.0 node_env
% . node_env/bin/activate
(node_env) % node -v
(node_env) % v16.15.0
(node_env) % npm -v
(node_env) % v8.5.5
```

Read more about `nodeenv` in [their docs](https://ekalinin.github.io/nodeenv/).

🛠️ Next, up [Installing MyST](./installing.md)

+++

## Node Version Manager - Linux/MacOS (`nvm`)

`nvm` is a convenient way to manage multiple node installations on a POSIX compatible system.

🛠️ Install `nvm` using the install script:

```shell
% curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
% nvm -v
0.39.1
```

💡 Note: on MacOS you can also install via `brew`

🛠️ Next, install an initial (default) version of `node`\:

```python
% nvm install 16
Downloading and installing node v16.15.0...
...
Now using node v16.15.0 (npm v8.5.5)
%
```

Read more about `nvm` in [their docs](https://github.com/nvm-sh/nvm).

🛠️ Next, up [Installing MyST](./installing.md)
