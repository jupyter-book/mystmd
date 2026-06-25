---
title: Deploy to GitLab Pages
short_title: GitLab Pages
description: Deploy your MyST site to GitLab pages.
---

GitLab Pages allows you to host static HTML files online from GitLab repositories using [GitLab CI/CD](https://docs.gitlab.com/ci/).
This page has important information for how to do so.

## Instructions

:::{warning}
Because of your institution’s GitLab configuration, the descriptions below may differ from the actual deployment on GitLab Pages.

If you are new to GitLab or you are not familiar with `git`, please proceed to [](#instructions-for-beginners)
:::

To get setup with GitLab Pages, ensure that your repository is hosted in GitLab and you are in the root of the Git repository.

### Deployment with uv
Create `.gitlab-ci.yml` file in the root of your project with the content provided below:

```{code} yaml
:filename: .gitlab-ci.yml
:linenos:
:emphasize-lines: 47

image: ghcr.io/astral-sh/uv:debian-slim

stages:
  - build
  - deploy

variables:
  HOST: "127.0.0.1"

cache:
  paths:
    - .venv

before_script:
  - uv --version

build:
  stage: build
  script:
    # initialize uv project and install jupyter-book
    - uv init
    - uv add "jupyter-book>=2.1.2,<3"

    # install node
    - apt-get update
    - apt-get install -y curl
    - apt-get install -y procps
    - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    - apt-get install -y nodejs

    # run jupyter-book via uv
    - uv run jupyter-book clean --all -y
    - export BASE_URL=""
    - uv run jupyter-book build --html
  artifacts:
    paths:
      - _build/html

pages:
  stage: deploy
  script:
    - mv _build/html/ public
  artifacts:
    paths:
      - public
  only:
    - main # replace it with YOUR branch name
```

then push this file to your GitLab repo.

> If your Git branch is different from `main`, you should replace main in the `.gitlab-ci.yml` file on the highlighted line with your branch name.

Once everything done, you should see `GitLab Pages` link in the right menu as shown below:
```{figure}  ./images/gitlab-pages.png
:height:300px
```

### Deployment with poetry
Create a file called `.gitlab-ci.yml` with the following content:


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

### Deployment with pixi
*Note*: You may not use pixi in your project but you may use it for GitLab deployment.

1. Make sure that you have [`pixi`](https://pixi.prefix.dev/latest/#installation) installed on your machine.

2. Create a file called `.gitlab-ci.yml` with the following content:

```{code} yaml
:filename: .gitlab-ci.yml
:linenos:
:emphasize-lines: 39 

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
    - main # replace it with your branch name!
```

> If your Git branch is different from `main`, you should replace main in the `.gitlab-ci.yml` file on the highlighted line with your branch name.

3. Make sure your pixi project is initialized (you may use `pixi init` CLI command to do so)

4. Make sure that your `pixi.toml` file contains `linux-64` as a platform and `python` with `jupyter-book` as dependencies.
    A minimal version of the `pixi.toml` file is shown below.

```{code-block} toml
:filename: pixi.toml

[workspace]
authors = ["Me <me@me.com>"]
channels = ["conda-forge"]
name = "jbtest"
platforms = ["win-64", "linux-64"]
version = "0.1.0"

[tasks]

[dependencies]
python = ">=3.14.3,<3.15"
jupyter-book = ">=2.1.2,<3"
```

5. Synchronize `pixi.lock` file using `pixi lock` CLI command.

> Note that a [pixi.toml](https://pixi.prefix.dev/latest/python/pyproject_toml/) and pixi.lock file should be tracked by Git and pushed to the repository with other files.

6. Add your project files to git using `git add ` (e.g `git add myst.yml main.md pixi.toml pixi.lock`)
7. Commit the changes
8. Push your branch to GitLab (e.g `git push -u origin main`)



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
  - apt-get install -y --no-install-recommends curl rsync openssh-client git procps

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

## Instructions for beginners
If this is your first time using GitLab, complete these one-time setup steps:
1. [Install Git](https://docs.gitlab.com/topics/git/how_to_install_git/) 
2. Configure your git by using the following commands in the terminal
    ```shell
    git config --global user.name "Your Name"
    git config --global user.email "your-mail@your-domain.com"
    ```
3. Create a GitLab account [on official
   GitLab](https://gitlab.com/users/sign_in/) or on the GitLab of your
   institution.
4. [Set up SSH authentication](https://docs.gitlab.com/user/ssh/)  

Once set up, you have two options to connect your project to GitLab:
1. *Start from GitLab*: [Create a repository on GitLab, clone it to your computer, add your files, and push them](https://docs.gitlab.com/tutorials/make_first_git_commit/#steps)
2. *Start from your computer*: Initialize your local folder as a Git repository and push it to GitLab using the following commands:
    ```bash
    cd your-project-folder   # go to your local folder with your myst project
    git init                 # initialize git
    git add .                # stage all files
    git commit -m "first commit"
    git remote add origin git@gitlab.com:username/project.git # you may change this link with the link of your repository
    git push -u origin main
    ```

Once your git project is initialized, create `.gitlab-ci.yml` file in the root
of your myst project and paste the contents described in [](#deployment-with-uv) to the file.


Once you saved the file with provided contents, execute the next commands:
```shell
git add .gitlab-ci.yml
git commit -m "added .gitlab-ci.yml to set up GitLab Pages"
git push
```

You are all done. You may proceed to the page of your GitLab repository and
open GitLab Pages.
