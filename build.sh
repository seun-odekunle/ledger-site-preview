#!/bin/zsh
# Rebuild the preview from ~/Developer/ledger-site (whatever branch is checked out there) into docs/.
set -euo pipefail
here=${0:A:h}; src=~/Developer/ledger-site; out=$here/docs
rm -rf $out && mkdir -p $out
rsync -a --exclude .git --exclude .claude --exclude CNAME --exclude README.md --exclude sitemap.xml --exclude robots.txt $src/ $out/
cp $here/review.js $here/review.css $out/
python3 -I $here/inject.py $out $src
