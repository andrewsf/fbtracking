#!/bin/bash

DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
pushd $DIR/js-sdk/
wget connect.facebook.net/en_US/all/debug.js -O all/debug.js;
wget connect.facebook.net/en_US/all.js -O all.js;
$DIR/bin/js-beautify/python/js-beautify all.js > all.beautified.js;
head -1 all.beautified.js | cut -d',' -f3 | cut -d'v' -f2 > version;
test -n "$(git diff --numstat HEAD version)" && (cat version | xargs -I {} git commit -am '{}');
git push
popd

