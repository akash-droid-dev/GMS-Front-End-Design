#!/bin/sh
# Rebuild the sport pages, fingerprint every asset link, and package the Netlify zip.
set -e
cd "$(dirname "$0")/.."
python3 tools/build-sports.py badminton tabletennis athletics swimming basketball volleyball tennis football > /dev/null
python3 tools/stamp.py
rm -f GMS-Netlify.new.zip
zip -qr GMS-Netlify.new.zip index.html "GMS v2.dc.html" support.js vendor assets sports sw.js manifest.webmanifest
mv -f GMS-Netlify.new.zip GMS-Netlify.zip
echo "GMS-Netlify.zip ready"
