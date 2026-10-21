# opencode-ascendant

## 1.1.1

### Patch Changes

- Point the npm package homepage at the live site instead of the retired alias.

  - `packages/opencode-ascendant/package.json` now sets `homepage` to `https://astro-ascendant.vercel.app` (was `https://ascendant-docs.vercel.app`, a 301 to the live site).
  - The package README links the docs at `https://astro-ascendant.vercel.app/docs/skills`.
  - The portable, Claude, and Codex plugin manifests carry the same homepage.

## 1.1.0

### Minor Changes

- 686f44a: Rename the `init` mode to `add` across the skill, CLI, and tools.

  - Skill argument is now `add` (`/ascendant add`), with routing, dispatch, setup, and README docs updated.
  - CLI command is `add-person` (was `init-person`); the root `add-person` script follows it.
  - OpenCode tool is `ascendant_add_person` (was `ascendant_init_person`); the shell script is `scripts/add-person.sh`.
  - Exported helpers are `addPerson` and `addPersonFromInput`.

### Patch Changes

- 241b3a2: Point repository metadata at the astro-ascendant org and add issue intake.

  - Set the git origin to `https://github.com/astro-ascendant/ascendant-agents.git`.
  - Add `homepage` (`https://astro-ascendant.vercel.app`) and `repository` to the root `package.json`.
  - Add GitHub issue templates for astrology miscalculation reports and feature requests.

## 1.0.3

### Patch Changes

- Fix OpenCode plugin load failure on hosts running effect 4.0.0-beta.x: replace `@effect/platform-node-shared` with `@effect/platform-bun` direct subpaths and a host-compatible `Path` layer, and go bun-only at runtime.

## 1.0.2

### Patch Changes

- Remove em dashes from the skill instructions and package docs, and add RELEASE.md with a `version` make target plus an npm upgrade in the release workflow for OIDC trusted publishing.

## 1.0.1

### Patch Changes

- Fix plugin load failure under OpenCode: keep `effect` and `@opencode/*` peer-only and import `@effect/platform-node-shared` Node layers via direct subpaths, so no private `effect/dist/*` module enters the plugin graph.

## 1.0.0

### Minor Changes

- Initial public release: OpenCode skill, `/ascendant` slash command, and in-process `ascendant_init_person` / `ascendant_check_transit` calculation tools.
