# Ascendant Agents

[![skills.sh](https://skills.sh/b/thaletto/ascendant-agents)](https://skills.sh/thaletto/ascendant-agents)

Save a birth chart once. Get consistent, evidence-backed readings every time.

No re-typing birth data. No made-up charts. Same input → same result.

## Why you'll love it

- **One record, endless questions**: career, timing, relationships, transits
- **KP by default, Parashari on request**: no mixed methods
- **Remembers what matters**: confirmed events build over time
- **Works where you work**: Claude, Codex, Cursor, Copilot, ChatGPT and more

## How it works

1. `init`: save birth data to generate Vedic and KP charts, dashas, Ashtakavarga
2. Ask anything: answers cite your stored chart, not vibes
3. `setup`: only when needed to install calculation deps

Just describe your birth details or ask a life question. It picks the right mode.

## Install in 30 seconds

**Claude Code:**
```text
/plugin marketplace add thaletto/ascendant-agents
/plugin install ascendant@ascendant
```

**Codex:**
```console
codex plugin marketplace add thaletto/ascendant-agents --ref main
codex plugin add ascendant@ascendant
```

**OpenCode:**
```console
opencode plugin add opencode-ascendant
```

**Any other agent:**
```console
npx skills add thaletto/ascendant-agents --skill ascendant
```

## For contributors

```bash
bun install --frozen-lockfile
bun run typecheck
make build-all   # match all versions, rebuild skills + opencode package
```

## Releasing opencode-ascendant

The npm package `opencode-ascendant` is generated from repo sources by
`node scripts/build-opencode-plugin.mjs` (plugin modules from
`.opencode/plugins/ascendant/`, skill tree from `skills/ascendant/`, version
and dependency pins stamped from `package.json` / `.opencode/package.json`).
Never hand-edit `packages/opencode-ascendant/plugin/` or
`packages/opencode-ascendant/skills/`.

```bash
make build-opencode-plugin
git tag opencode-ascendant-v1.0.0  # match packages/opencode-ascendant/package.json
git push origin opencode-ascendant-v1.0.0
```

Pushing the tag runs `.github/workflows/release-opencode.yml`, which rebuilds
the package, verifies the tag matches the stamped version, and runs
`npm publish --provenance --access public`. First publish needs either an
`NPM_TOKEN` repo secret or a trusted publisher configured on npmjs.com for
this package; see the workflow file.

Requires a recent OpenCode v2 host (the plugin needs an Effect ≥4.0.4
runtime for `@effect/platform-node-shared`).
