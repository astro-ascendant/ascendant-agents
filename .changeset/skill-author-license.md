---
"opencode-ascendant": patch
---

Publish the author and license in the skill frontmatter.

`SKILL.src.md` now declares `license: AGPL-3.0-or-later` and
`metadata.author: Laxman K R`, matching `plugin.json` and the repository
license. The builder previously emitted only a fixed key set, so it now
carries `license` and `metadata` through to the canonical `SKILL.md` and the
Claude plugin copy; a missing field would have been dropped silently.

The test reads all three files and fails if any copy loses either field.
