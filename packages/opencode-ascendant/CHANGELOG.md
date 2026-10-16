# opencode-ascendant

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
