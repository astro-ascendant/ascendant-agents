---
"opencode-ascendant": minor
---

Ask for the reading method instead of assuming KP.

The skill treated KP as the default track whenever the user did not name a
school. Setup now records the preference in `<cwd>/.ascendant/config.txt`:

```text
defaultMethod: KP | Parashari | NULL
askMethodEverySession: TRUE | FALSE
```

Both keys are asked during `setup`. `NULL` means ask every time and forces
`askMethodEverySession: TRUE`. Analysis resolves the school in order: a school
named in the request, then `askMethodEverySession`, then `defaultMethod`, and
finally a one-line question. A missing file reads as `NULL` and `TRUE`, so the
skill asks rather than guessing.

`scripts/config.sh show|set` reads and writes the file, and the directory
self-ignores with `*`. Tests pin canonical values, the `NULL` coercion, the
missing-file default, and rejection of an unknown method.
