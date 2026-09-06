# jyotim.com — how this repo works

**This repo IS the live website.** Whatever sits at the root is what GitHub Pages serves at
https://jyotim.com. There is no build step for the landing page and no staging environment: a push to
`main` is a publish.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The landing page. **Hand-authored — this file is the source.** There is no generator for it. |
| `privacy/`, `terms/`, `delete-account/` | **Generated.** Never hand-edit these; see below. |
| `img/`, `favicon-64.png` | Site images, served publicly |
| `app-ads.txt` | AdMob inventory verification. Must stay at the domain root. |
| `robots.txt`, `sitemap.xml`, `CNAME` | Crawler and domain config |
| `_src/` | **Everything in here is source, not site.** Jekyll ignores directories beginning with `_`, so nothing in `_src/` is published. |

## The legal pages are generated, and their source is in the APP repo

`legal/PRIVACY_POLICY.md`, `TERMS_OF_SERVICE.md` and `DELETE_ACCOUNT.md` live in **`06_PujaDaysApp/legal/`**,
not here. That is deliberate: they are company documents the app also references
(`src/constants/legal.js` publishes their URLs), so they have exactly one source.

To change a legal page:

```bash
# 1. edit the markdown in the APP repo
#    06_PujaDaysApp/legal/PRIVACY_POLICY.md
# 2. regenerate the HTML here
cd _src && node _render_legal.mjs
# 3. review locally, then commit + push from the repo root
```

⚠ `_render_legal.mjs` assumes **`jyotim-website/` and `06_PujaDaysApp/` are siblings**. If that
changes, the `LEGAL` constant at the bottom of that file is the only line to fix.

## Reviewing before you publish

```bash
cd _src && node _serve.mjs      # serves the repo ROOT on http://localhost:8123
```

What you see there is exactly what a push would make live — same files, no build.
For mobile: F12 then Ctrl+Shift+M in Chrome.

## Publishing

```bash
git add -A && git commit -m "…" && git push
```

Pages redeploys in about a minute. Verify from outside rather than trusting the repo view:

```bash
curl -s https://jyotim.com/privacy/ | sha256sum
sha256sum privacy/index.html
```

Push, do not upload through the web UI: the browser uploader places files relative to whatever
folder you are viewing, which is easy to get wrong.

## Two rules that are easy to break

**1. `color-scheme: only light` must stay on every page** (a `<meta>` tag and a `:root` CSS rule).
Without it, Chrome's auto-dark and the Google app's in-app browser force-darken the page — the cream
ground turns brown and the Play badge gets a grey box.
Do not remove it without building a real dark palette for the whole warm/maroon identity.

**2. `sitemap.xml` lists ONLY the homepage.** The three legal pages carry `noindex`, and listing a
noindex page makes Search Console report "Excluded by noindex" on every crawl. If a legal page should
ever be findable, remove its `noindex` **and** add it to the sitemap — never one without the other.

## Line endings

`.gitattributes` sets `* -text`, so git never rewrites them. Without it a Windows checkout gets CRLF
while the repo and the live site have LF, and the working copy silently stops matching what is served.

## Launch day

One change: in `index.html`, wrap the Play badge in a link to
`https://play.google.com/store/apps/details?id=com.pujadays.app` and delete the `COMING SOON` span.
Exact before/after markup is kept with the project notes.
