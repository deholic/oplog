# generate-oplog

`generate-oplog` is a small multi-target skill/plugin repo for producing the `oplog` skill from one canonical source.

The goal is to keep the actual behavior in one place, then render target-specific artifacts for:

- OpenCode
- Claude plugin / Marketplace packaging

## Repository structure

```text
canonical/
  oplog/
    meta.json
    body.md
    references/
      obsidian.md
      atlassian.md

scripts/
  render-targets.js

.agents/skills/oplog/           # generated OpenCode-facing skill output
skills/oplog/                  # generated Claude plugin skill output
.claude-plugin/plugin.json     # generated Claude plugin manifest
opencode.jsonc                 # OpenCode-only runtime config
```

## Source of truth

Do not hand-edit generated target files.

The editable source of truth lives under `canonical/oplog/`:

- `canonical/oplog/meta.json`: shared metadata such as skill name, plugin name, version, and description
- `canonical/oplog/body.md`: host-neutral main skill body
- `canonical/oplog/references/obsidian.md`: provider reference for Obsidian
- `canonical/oplog/references/atlassian.md`: provider reference for Atlassian / Confluence

Generated files currently include:

- `.agents/skills/oplog/SKILL.md`
- `.agents/skills/oplog/references/*`
- `skills/oplog/SKILL.md`
- `skills/oplog/references/*`
- `.claude-plugin/plugin.json`

## Why this structure exists

This repo started from an OpenCode-oriented skill layout. To support Claude as well without maintaining two copies of the same instructions, the shared behavior was moved into canonical Markdown and rendered back out to each target.

That means:

- shared behavior stays in canonical docs
- host-specific packaging stays at the edges
- generated outputs are reproducible
- future Claude-specific packaging can grow without re-forking the core skill text

## Render workflow

After editing anything under `canonical/oplog/`, regenerate the target outputs:

```bash
npm run render
```

This runs the same renderer as:

```bash
node scripts/render-targets.js
```

To verify that generated files are up to date:

```bash
npm run check:generated
```

This checks the same generated outputs as:

```bash
node scripts/render-targets.js --check
```

The check command fails when a generated file is missing or has drifted from the canonical source.

## Manual verification workflow

This repo does not install or rely on git hooks. After editing canonical inputs, run the render and check commands manually before committing:

```bash
npm run render
npm run check:generated
```

Commit both the canonical edits and the regenerated target outputs together so the published skill artifacts stay reproducible.

## Editing rules

### Edit these

- `canonical/oplog/meta.json`
- `canonical/oplog/body.md`
- `canonical/oplog/references/*.md`
- `scripts/render-targets.js` when target generation rules need to change

### Do not edit these by hand

- `.agents/skills/oplog/**`
- `skills/oplog/**`
- `.claude-plugin/plugin.json`

If you need to change a generated file, make the change in `canonical/` or in the renderer, then regenerate.

## Available npm scripts

- `npm run render`: regenerate `.agents/skills/oplog`, `skills/oplog`, and `.claude-plugin/plugin.json`
- `npm run check:generated`: verify generated files are present and up to date

## Current targets

### OpenCode

- Skill output path: `.agents/skills/oplog/`
- Runtime config: `opencode.jsonc`
- `opencode.jsonc` remains manually owned because it is OpenCode-specific runtime wiring, not shared skill behavior

### Claude plugin / Marketplace

- Skill output path: `skills/oplog/`
- Plugin manifest: `.claude-plugin/plugin.json`
- The current manifest is intentionally minimal and should only grow as Claude packaging requirements become concrete

## Design guidelines

When extending this repo, prefer these rules:

1. Keep the main skill text host-neutral.
2. Keep provider policy canonical where possible.
3. Move host-specific command syntax or packaging details to the edges.
4. Avoid creating a second source of truth in generated folders.
5. Add new metadata only when at least one real target needs it.

## Notes

- The generated skill frontmatter currently uses the shared `skillName` from `canonical/oplog/meta.json`.
- The Claude plugin namespace currently uses `pluginName` from the same metadata file.
- If Claude Marketplace later requires more plugin files, add them as generated edge artifacts rather than pushing that detail back into the canonical body.
