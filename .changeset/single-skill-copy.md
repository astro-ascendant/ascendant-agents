---
"opencode-ascendant": major
---

Ship one skill copy instead of eight.

The repo committed a generated `skills/ascendant/` tree under `.claude/`, `.cursor/`,
`.gemini/`, `.kiro/`, `.pi/`, `.grok/`, and `.agent/`. None of them had an install path:
`npx skills add astro-ascendant/skills` reads the canonical `skills/ascendant/`, the
Claude plugin ships `.claude-plugin/skills/ascendant/`, Codex reads `skills/` through
`.codex-plugin/plugin.json`, and OpenCode registers everything from
`.opencode/plugins/ascendant/`. The seven trees were pure duplication (about 2.1k lines
each), so any skill edit landed nine times in review and CI drift checks.

`bun run build:skill` now writes only the canonical `SKILL.md` and the Claude plugin
copy. Harnesses without a plugin shim install the canonical skill globally with
`npx skills`, which was already the documented path. Cursor, Gemini, Kiro, Pi, Grok,
and Antigravity lose their committed repo-local copy and nothing else.

BREAKING CHANGE: cloning the repo no longer provides `<harness>/skills/ascendant/`
for those six harnesses. Install the plugin (Claude, Codex, OpenCode) or add the
canonical skill globally.
