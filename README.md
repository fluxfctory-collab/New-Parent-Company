# The Guardian Group — gateway page

Static one-page gateway directing litigation teams to Merlin, Guardian Medical Advisory
and Guardian Civil Services, built around a three-tier pyramid that is also the navigation.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (no JavaScript shipped)
npm test         # build + Playwright/axe verification
```

Design decisions, verification results, client source issues and screenshots:
see [HANDOVER.md](HANDOVER.md). The client's original files are in `_brief/` (untouched).
