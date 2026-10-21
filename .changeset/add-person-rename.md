---
"opencode-ascendant": minor
---

Rename the `init` mode to `add` across the skill, CLI, and tools.

- Skill argument is now `add` (`/ascendant add`), with routing, dispatch, setup, and README docs updated.
- CLI command is `add-person` (was `init-person`); the root `add-person` script follows it.
- OpenCode tool is `ascendant_add_person` (was `ascendant_init_person`); the shell script is `scripts/add-person.sh`.
- Exported helpers are `addPerson` and `addPersonFromInput`.
