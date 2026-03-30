---
title: Deploy to GitLab Pages
short_title: GitLab Pages
description: Deploy your MyST site to GitLab pages.
---

GitLab Pages allows you to host static HTML files online from GitLab repositories using GitLab CI/CD.
This page has important information for how to do so.

## Instructions

To get setup with GitLab Pages, ensure that your repository is hosted in GitLab and you are in the root of the Git repository.
Create a file called `.gitlab-ci.yml` with the following content:


:::{note} GitLab CI/CD Example
:class: dropdown

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

:::

A `HOST` is set to fix a known [issue](https://github.com/jupyter-book/mystmd/issues/2471).

deploy -> pages

## External server through GitLab CI/CD
Another option is to deploy your MyST site to an external server through GitLab CI/CD. A main difference is setting 'variables' (settings $\rightArrow$ CI/CD $\rightArrow$ variables) for connecting to the server. 

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

  # Node.js (MyST tooling kan node nodig hebben)
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y --no-install-recommends nodejs
  - node --version
  - npm --version

  # Python deps
  - python -m pip install --upgrade pip
  - pip install mystmd

  # SSH key laden
  - eval "$(ssh-agent -s)"
  - chmod 400 "$WEBSITE_UPLOAD_KEY"
  - ssh-add "$WEBSITE_UPLOAD_KEY"

deploy:
  stage: deploy
  script:
    # Build (belangrijk: geef het projectpad mee)
    - myst build --html 
   
    - rsync -ravz "${LOCAL_BUILD_DIR}/" -e "${SSH_COMMAND} -i ${WEBSITE_UPLOAD_KEY}" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

```