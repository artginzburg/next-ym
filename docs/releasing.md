# Releasing

One command does everything: version bump, tag, push, npm publish, GitHub Release.

## Prerequisites

- Logged into npm: run `npm login` beforehand so `npm publish` doesn't fail mid-release.
- **`gh` CLI** authenticated (`gh auth status`).
- Clean working tree (no uncommitted changes).

## Release

```bash
pnpm version patch   # 1.3.5 → 1.3.6
pnpm version minor   # 1.3.5 → 1.4.0
pnpm version major   # 1.3.5 → 2.0.0
```

That's it. What happens automatically:

1. **`preversion`** — runs `pnpm lint:ts && pnpm test`. If anything fails, the release aborts before any changes.
2. **`npm version`** — bumps `package.json`, creates a commit and a git tag.
3. **`postversion`**:
   - `git push --follow-tags` — pushes the commit + tag to GitHub.
   - `npm publish` — triggers `prepublishOnly` (build + generate `llms.txt`/`llms-full.txt`), then publishes.
   - `gh release create vX.Y.Z --generate-notes` — creates a GitHub Release with auto-generated notes from commits since the previous tag.

## If something breaks mid-release

- **Lint or tests fail** → nothing is committed, fix and retry.
- **Push fails** → `npm version` already committed and tagged locally. Fix the push issue (usually network), then run `git push --follow-tags && npm publish && gh release create vX.Y.Z --generate-notes` manually.
- **`npm publish` fails** → check `npm whoami`. If unauthenticated, run `npm login`.
- **`gh release create` fails** → the version is already published to npm. Just run `gh release create vX.Y.Z --generate-notes` manually.

## Release notes quality

`--generate-notes` uses commit messages between tags. Keep commit messages readable (`fix:`, `feat:`, `docs:` prefixes help GitHub group them) so the auto-generated notes stay useful.
