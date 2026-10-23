---
"opencode-ascendant": major
---

Keep KP-only data out of the Parashari chart files.

`charts/D1.md` through `charts/D60.md` were emitted by a school-blind formatter: every
varga carried KP's `Star Lord` / `Sub Lord` / `Sub-Sub Lord` cuspal chain, and
`charts/D1.md` additionally carried `House Significations`, `Planet Significations`,
`House Significators`, and `Ruling Planets`. Those quantities belong to KP alone, and
in `charts/` they were computed from Lahiri whole-sign cusps rather than
Krishnamurti / Placidus ones, so they were invalid for both schools.

Parashari charts now print `House | Cusp | Point | Sign Lord | Longitude | Degree |
Sign | Dignity | Retrograde`, with empty houses keeping their cusp, sign, and rashi
lord. KP keeps the full four-lord chain, significations, significators, and ruling
planets in `kp/D1.md` as before. Chart titles drop the duplicated division suffix
(`# Vedic Chart D1`, `# KP Chart D1`) and provenance is stated once in the calculation
table.

BREAKING CHANGE: existing `persons/<name>/charts/` files keep the old hybrid format
until the record is regenerated. Re-run `add` to rewrite them; no other file changes
meaning.
