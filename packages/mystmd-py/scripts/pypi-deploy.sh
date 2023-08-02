#!/bin/bash
bash ./scripts/bump-version.sh
cp ../mystmd/dist/myst.cjs mystmd_py
rm -rf dist
python -m build
python -m twine upload dist/*
