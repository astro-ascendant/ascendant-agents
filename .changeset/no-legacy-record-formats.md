---
"opencode-ascendant": major
---

Stop reading person records written by retired artifact formats.

Records were saved as `input.txt`, then `input.toon`, then `input.json` before the
Markdown format landed. The engine carried a fallback reader for all three plus a
cleanup list that deleted the old `charts/*.txt|toon|json`, `dasha.txt`, `sav.txt`,
`kp/D1.txt`, and `jaimini/*` files on refresh. That list had already drifted (it
covered three extensions for charts and jaimini but only `.txt` for the KP artifacts)
and two of its helpers, `readLegacyToonStoredPerson` and `readLegacyStoredPerson`,
had no callers at all.

`input.md` is now the only accepted record format. A directory without it returns
`PersonRecordConflict` naming the directory and the retired filename, so the fix is
to move or delete `persons/<name>/` and run `add` again. `person latest` counts only
Markdown records. The dead helpers, the dead `ToonEncodingError`, and the cleanup
list are gone; `ToonDecodingError` is now `RecordDecodingError` because it only
reports frontmatter and schema problems. `@toon-format/toon` stays a dependency:
CLI and plugin output are still TOON-encoded.

BREAKING CHANGE: records created by an older version are no longer readable. Move or
delete `persons/<name>/`, then run `add` with the same birth data to regenerate it.
