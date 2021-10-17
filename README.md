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
