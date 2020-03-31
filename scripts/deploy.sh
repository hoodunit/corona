#!/usr/bin/env bash
git stash save wip
git branch -D gh-pages
git checkout -b gh-pages
npm run compile && npm run build &&
git add public/app.js --force &&
git commit -m "Auto-add app.js" &&
git push origin gh-pages:gh-pages --force &&
git checkout master
