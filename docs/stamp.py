#!/usr/bin/env python3
# keepingledger.com: names every local file a page loads with a short hash of that file's contents
# (day.css?v=1a2b3c4d). GitHub Pages lets a browser keep a stylesheet or script for ten minutes, so without this a
# returning visitor could get a new page with old styles. Run it before publishing, from the site's folder:
#     python3 stamp.py          rewrites the pages (and hero.js, which loads the phone screen's stylesheet itself)
#     python3 stamp.py --check  changes nothing; exits 1 if any stamp is out of date
# A file that hasn't changed keeps its stamp, so running it twice changes nothing.
import hashlib, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
check = "--check" in sys.argv
REF = re.compile(r'((?:href|src|poster)=")((?!https?:|//|#|data:|mailto:)[^"?#]+\.(?:css|js|jpg|jpeg|png|webp|svg|mp4))(?:\?v=[0-9a-f]+)?(")')
stale = []

def digest(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:8]

def stamp(name):
    path = os.path.join(here, name)
    text = open(path, encoding="utf-8").read()
    def one(m):
        target = os.path.join(here, m.group(2).lstrip("/"))
        if not os.path.isfile(target):
            return m.group(0)
        return m.group(1) + m.group(2) + "?v=" + digest(target) + m.group(3)
    new = REF.sub(one, text)
    if new != text:
        stale.append(name)
        if not check:
            open(path, "w", encoding="utf-8").write(new)

stamp("hero.js")                                   # first: the pages below are stamped with hero.js's own hash
for name in sorted(os.listdir(here)):
    if name.endswith(".html"):
        stamp(name)
if check and stale:
    print("out of date:", ", ".join(stale)); sys.exit(1)
print("stamped:" if stale else "nothing to change", ", ".join(stale))
