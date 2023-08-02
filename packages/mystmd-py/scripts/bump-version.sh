#!/bin/bash
CURRENT=`awk -F'"' '/"version": ".+"/{ print $4; exit; }' ../mystmd/package.json`
PREVIOUS=`awk -F' ' '/version = .+/{ print $3; exit; }' setup.cfg`
echo "bumping mystmd-py: $PREVIOUS => $CURRENT"
sed -i "" "s/$PREVIOUS/$CURRENT/" setup.cfg
