# Netlify Deployment Report

**Date:** 2026-06-10
**Result:** ✅ Production deploy live and verified.

## Site

| Field | Value |
| --- | --- |
| Project | `teoriaegrafeve` |
| Live URL | https://teoriaegrafeve.netlify.app |
| Admin | https://app.netlify.com/projects/teoriaegrafeve |
| Project ID | `50d18ba1-01c8-40ab-812d-6f5f3e6a8223` |
| Team | Bezzinjooo |
| Authenticated CLI user | Blerim Haxhiu |

## Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "out"
```

- **Framework:** Next.js 15 with `output: 'export'` → fully static site in `out/`.
- **Build command:** `npm run build`
- **Publish directory:** `out`
- No serverless/edge functions are required (static export).

## Deploy method used

The Netlify CLI was already authenticated and linked (`.netlify/state.json`
holds the site ID). The verified production build in `out/` (the same artifact
the screenshots were captured from, matching the committed code) was deployed
directly to production:

```bash
npm run build                                  # produce out/ (static export)
npx netlify deploy --prod --dir=out --no-build # upload out/ to production
```

## Deploy result

```
✔ Finished hashing 40 files and edge functions
✔ CDN requesting 12 files
✔ Finished uploading 12 assets
✔ Deploy is live!

Production URL:     https://teoriaegrafeve.netlify.app
Unique deploy URL:  https://6a28c0bee117677d83cacf02--teoriaegrafeve.netlify.app
Build logs:         https://app.netlify.com/projects/teoriaegrafeve/deploys/6a28c0bee117677d83cacf02
```

## Post-deploy verification

| Check | Result |
| --- | --- |
| `GET /` | HTTP 200, 17,232 bytes (matches local `out/index.html`) |
| `GET /app` | HTTP 200, 11,714 bytes (matches local `out/app.html`) |
| Page `<title>` | `Graph Algorithm Visualizer` |

The byte sizes match the locally built and verified artifacts, confirming the
live site serves exactly the committed code.

## Live URL

➡️ **https://teoriaegrafeve.netlify.app**

## Manual fallback steps

If you need to deploy again from a clean machine:

```bash
# 1. Install + authenticate (one-time)
npm install
npx netlify login          # opens browser to authenticate
npx netlify link           # link to the "teoriaegrafeve" site (or use the site ID above)

# 2a. Let Netlify build + deploy (uses netlify.toml)
npx netlify deploy --prod

# 2b. OR build locally and upload the static export
npm run build
npx netlify deploy --prod --dir=out --no-build
```

### Continuous deployment (optional)

The repository is on GitHub
(`https://github.com/BlerimHaxhiu/GraphTheoryProj-Algorithms.git`). If the
Netlify site is connected to that repo under **Site settings → Build & deploy**,
every push to `main` will trigger an automatic production build using
`npm run build` → publish `out`. The manual CLI deploy above is always available
as a fallback.

> Windows note: stop any local `next dev` server before running a local
> `npm run build`; a running dev server can hold a `.next` file lock and cause an
> `EPERM` on `.next/trace`. This does not affect Netlify's clean build
> environment.
