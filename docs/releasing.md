# Releasing

One command bumps the version locally; GitHub Actions publishes to npm with provenance on tag push.

## Prerequisites

- **`gh` CLI** authenticated (`gh auth status`).
- Clean working tree (no uncommitted changes).
- Repo secret `NPM_TOKEN` configured (npm automation token) for the publish workflow.

## Release

```bash
pnpm version patch   # 1.3.5 → 1.3.6
pnpm version minor   # 1.3.5 → 1.4.0
pnpm version major   # 1.3.5 → 2.0.0
```

That's it. What happens:

1. **`preversion`** — runs `pnpm lint:ts && pnpm test`. If anything fails, the release aborts before any changes.
2. **`npm version`** — bumps `package.json`, creates a commit and a git tag.
3. **`postversion`**:
   - `git push --follow-tags` — pushes the commit + tag to GitHub.
   - `gh release create vX.Y.Z --generate-notes` — creates a GitHub Release with auto-generated notes.
4. **GitHub Actions (`publish.yml`)** triggers on the tag push:
   - Builds, generates `llms.txt`/`llms-full.txt` (via `prepublishOnly`), publishes to npm with `--provenance`.

Publishing from CI produces an npm provenance attestation — this is what Socket.dev and other supply-chain scanners look for.

## If something breaks mid-release

- **Lint or tests fail** → nothing is committed, fix and retry.
- **Push fails** → `npm version` already committed and tagged locally. Fix the push, then run `git push --follow-tags && gh release create vX.Y.Z --generate-notes` manually.
- **Publish workflow fails** → re-run it from the Actions tab after fixing the cause (missing `NPM_TOKEN`, build break, etc.). The tag already exists; no need to re-tag.
- **`gh release create` fails** → tag is already pushed and CI is already publishing. Just run `gh release create vX.Y.Z --generate-notes` manually afterwards.

## Release notes quality

`--generate-notes` uses commit messages between tags. Keep commit messages readable (`fix:`, `feat:`, `docs:` prefixes help GitHub group them) so the auto-generated notes stay useful.
