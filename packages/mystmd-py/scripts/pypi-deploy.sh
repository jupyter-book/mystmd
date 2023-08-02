#!/bin/bash
cp ../mystmd/dist/myst.cjs mystmd_py
CURRENT=`awk -F'"' '/"version": ".+"/{ print $4; exit; }' ../mystmd/package.json`
PREVIOUS=`awk -F' ' '/version = .+/{ print $3; exit; }' setup.cfg`
sed -i "" "s/$PREVIOUS/$CURRENT/" setup.cfg
rm -rf dist
python -m build
python -m twine upload dist/*
