#!/bin/bash
set -e
cp ../mystmd/dist/myst.cjs mystmd_py
cp ../mystmd/package.json .
rm -rf dist
python -m build
python -m twine upload dist/*
