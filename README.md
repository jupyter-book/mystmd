# `curvenote`

[![curvenote on npm](https://img.shields.io/npm/v/curvenote.svg)](https://www.npmjs.com/package/curvenote)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/curvenote/curvenotejs/blob/main/LICENSE)
![CI](https://github.com/curvenote/curvenotejs/workflows/CI/badge.svg)

## Overview

`curvenote` is a library and command line interface to access information and the API of <https://curvenote.com>. It includes utilities to export to various formats.

## Basic usage of command line

```bash
npm install -g curvenote
curvenote token set YOUR_TOKEN
curvenote export docx https://curvenote.com/@curvenote/blog/communicating-science communicating-science.docx
curvenote export md https://curvenote.com/@curvenote/blog/version-control-for-scientists version-control.md
curvenote export tex https://curvenote.com/@curvenote/blog/version-control-for-scientists version-control.tex -template plain_latex
curvenote export pdf https://curvenote.com/@curvenote/blog/version-control-for-scientists version-control.pdf -template arxiv_nips
```

## Dependencies

Exporting to:

- LaTeX (`latex`|`tex`) with a template option specified
- or to PDF

Requires the [jtex](https://pypi.org/project/jtex/) python package to be installed and available on the user's `PATH`.

With python 3.7 or greater installed, install `jtex` via pip:

```bash
  python -m pip install jtex
```

## Usage as a package

```ts
import { Session, MyUser } from 'curvenote';

const session = new Session(token);
const user = await new MyUser(session).get();
console.log(user.data.username);
```

## Supported Models

- MyUser
- User
- Team
- Project
- Block
- Version

## Supported Export

- Microsoft Word (.docx)
- Markdown (.md)
- LaTeX (.tex)
- PDF (.pdf)
