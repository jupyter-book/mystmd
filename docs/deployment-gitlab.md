---
title: Deploy to GitLab Pages
short_title: GitLab Pages
description: Deploy your MyST site to GitLab pages.
---

GitLab Pages allows you to host static HTML files online from GitLab repositories using [GitLab CI/CD](https://docs.gitlab.com/ci/).
This page has important information for how to do so.

## Instructions

To get setup with GitLab Pages, ensure that your repository is hosted in GitLab and you are in the root of the Git repository.
Create a file called `.gitlab-ci.yml` with the following content:


`````{tab-set}
````{tab-item} Pixi based
```{code} yaml
:filename: .gitlab-ci.yml


image: ghcr.io/prefix-dev/pixi:latest

stages:
  - build
  - deploy

variables:
  PIXI_CACHE_DIR: "$CI_PROJECT_DIR/.pixi"
  HOST: "127.0.0.1"

cache:
  paths:
    - .pixi

before_script:
  - pixi --version

build:
  stage: build
  script:
    # install environment from pixi.toml + pixi.lock
    - pixi install --locked

    # run jupyter-book via pixi environment
    - pixi run jupyter-book build --html
  artifacts:
    paths:
      - _build/html

pages:
  stage: deploy
  script:
    - mkdir public
    - cp -r _build/html/* public/
  artifacts:
    paths:
      - public
  only:
    - main
```
```` 
````{tab-item} Poetry based
```{code} yaml
:filename: .gitlab-ci.yml
variables:
  PYTHON_VERSION: 3.13
  POETRY_VERSION: 2.3.0

default:
  image:
    name: python:$PYTHON_VERSION
    pull_policy: if-not-present

.install_poetry_linux: &install_poetry_linux
  - python -m pip install --user pipx
  - python -m pipx ensurepath
  - source ~/.bashrc
  - pipx install poetry==$POETRY_VERSION

build_book:
  stage: build
  before_script:
    - *install_poetry_linux
  script:
    - poetry install --extras "book"
    # Install Node.js, which is required by Jupyter Book 2.
    # Download and install nvm:
    - curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    # in lieu of restarting the shell
    - \. "$HOME/.nvm/nvm.sh"
    # Download and install Node.js. This version must be compatible with Jupyter Book.
    - nvm install 24
    # Download imagemagick, which is needed by Jupyter Book 2 to build pdf.
    # - curl https://imagemagick.org/archive/binaries/magick -o "magick"
    # Set the base URL, which is required by static builds.
    - export BASE_URL="/my-website"
    # Set the HOST because of https://github.com/jupyter-book/mystmd/issues/2471
    - export HOST="127.0.0.1"  # Needed to avoid binding to ::1.
    # Build book.
    - cd my_jupyter_book
    - poetry run jupyter-book build --html --check-links --ci
  interruptible: true
  artifacts:
    paths:
      - my_jupyter_book/_build/html/
    expire_in: 1d
  tags:
    - ubuntu

pages:
  stage: deploy
  dependencies: ["build_book"]
  script:
    - mv my_jupyter_book/_build/html public
  interruptible: false
  artifacts:
    paths:
      - public
    expire_in: 1h
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  tags:
    - ubuntu
```
````
`````


You must set the `HOST` - this is a fix for a [known issue](https://github.com/jupyter-book/mystmd/issues/2471).

Note that a [pixi.toml](https://pixi.prefix.dev/latest/python/pyproject_toml/) and pixi.lock file should be included!

A minimal version is shown below.

```{code-block} toml
:filename: pixi.toml

[workspace]
authors = [{name = "Me", email = "me@me.com"}]
channels = ["conda-forge"]
name = "jbtest"
platforms = ["win-64", "linux-64"]
version = "0.1.0"

[tasks]

[dependencies]
python = ">=3.14.3,<3.15"
jupyter-book = ">=2.1.2,<3"
```



## External server through GitLab CI/CD
Another option is to deploy your MyST site to an external server through GitLab CI/CD. A main difference is setting 'variables' (settings $\rightarrow$ CI/CD $\rightarrow$ variables) for connecting to the server. 

An example `.gitlab-ci.yml` file for this deployment method is shown below.

```{code} yaml
:filename: .gitlab-ci.yml
:lineos:

stages:
  - deploy

image: python:3.11-slim

variables:
  SSH_COMMAND: 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o IdentitiesOnly=yes'
  LOCAL_BUILD_DIR: "_build/html"
  HOST: "127.0.0.1"
  BASE_URL: ""
  
before_script:
  - apt-get update
  - apt-get install -y --no-install-recommends curl rsync openssh-client git

  # Node.js 
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y --no-install-recommends nodejs
  - node --version
  - npm --version

  # Python deps
  - python -m pip install --upgrade pip
  - pip install mystmd

  # Load SSH key 
  - eval "$(ssh-agent -s)"
  - chmod 400 "$WEBSITE_UPLOAD_KEY"
  - ssh-add "$WEBSITE_UPLOAD_KEY"

deploy:
  stage: deploy
  script:
    # Build (important: define the project path)
    - myst build --html 
   
    - rsync -ravz "${LOCAL_BUILD_DIR}/" -e "${SSH_COMMAND} -i ${WEBSITE_UPLOAD_KEY}" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

```

Note that this way of deploying requires a gitlab runner.