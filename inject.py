# Turns a copy of keepingledger.com into the preview: hidden from search engines, no analytics, the review panel on
# the home page, and the build's commit in the panel's corner.
import sys, os, re, subprocess, datetime
out, src = sys.argv[1], sys.argv[2]
commit = subprocess.run(["git", "-C", src, "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
branch = subprocess.run(["git", "-C", src, "branch", "--show-current"], capture_output=True, text=True).stdout.strip()
built = f"{branch} @ {commit}, {datetime.date.today():%b %-d}"
for name in os.listdir(out):
    if not name.endswith(".html"): continue
    p = os.path.join(out, name); s = open(p, encoding="utf-8").read()
    s = re.sub(r"<!-- Cloudflare Web Analytics -->.*?<!-- End Cloudflare Web Analytics -->", "", s, flags=re.S)
    s = s.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow">', 1)
    # GitHub Pages lets a browser keep a stylesheet or script for ten minutes, so a fresh page could arrive with stale
    # styles. Every local file a page loads is named with this build's commit, so a new build is always fetched.
    s = re.sub(r'((?:href|src|poster)=")((?!https?:|//|#|data:|mailto:)[^"?#]+\.(?:css|js|jpg|jpeg|png|webp|svg|mp4))(")',
               lambda m: m.group(1) + m.group(2) + "?v=" + commit + m.group(3), s)
    if name == "index.html":
        s = s.replace("<html lang=\"en\">", f'<html lang="en" data-built="{built}">', 1)
        s = s.replace("</head>", '<link rel="stylesheet" href="review.css">\n<script src="review.js" defer></script>\n</head>', 1)
    open(p, "w", encoding="utf-8").write(s)
# The hero's script loads the phone screen's stylesheet itself; name that with the commit too.
hero = os.path.join(out, "hero.js")
if os.path.exists(hero):
    h = open(hero, encoding="utf-8").read()
    open(hero, "w", encoding="utf-8").write(h.replace('href="hero-app.css"', 'href="hero-app.css?v=' + commit + '"'))
open(os.path.join(out, "robots.txt"), "w").write("User-agent: *\nDisallow: /\n")
open(os.path.join(out, ".nojekyll"), "w").write("")
print("built", built)
