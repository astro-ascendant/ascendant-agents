#!/usr/bin/env node
/**
 * Guard the OpenCode plugin against host-blocked imports.
 *
 * OpenCode provides `effect` (public single-level `effect/*` subpaths only)
 * and `@opencode/plugin` at runtime and redirects those imports to the host
 * instance. Anything resolving to a private `effect/dist/*` path fails the
 * whole plugin load with:
 *
 *   Cannot load "effect/dist/..." from plugin node_modules ...
 *
 * In practice this means:
 *
 *   1. Plugin sources must never import the `@effect/platform-node-shared`
 *      barrel or any deep `effect/x/y` specifier. The barrel
 *      re-exports socket/cluster modules (e.g. NodeAddressResolver) that
 *      import private `effect/net/*` paths. Import Node* layers via direct
 *      subpaths (`@effect/platform-node-shared/NodeFileSystem`, ...), whose
 *      transitive imports stay within public `effect/*` subpaths.
 *   2. `effect` and `@opencode/*` must be peer-only (never `dependencies`)
 *      in the publishable `packages/opencode-ascendant` manifest and in the
 *      local `.opencode` container, so no second Effect copy ships with the
 *      plugin.
 *
 * Run: `node scripts/check-plugin-externals.mjs` (or `npm run check:plugin`).
 * No dependencies.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const BARREL = "@effect/platform-node-shared";

// TS sources reachable from the plugin entrypoint (tests excluded).
const SOURCE_DIRS = [
  path.join(ROOT_DIR, ".opencode", "plugins", "ascendant"),
  path.join(ROOT_DIR, "skills", "ascendant", "tools"),
  path.join(ROOT_DIR, "packages", "opencode-ascendant", "plugin"),
  path.join(ROOT_DIR, "packages", "opencode-ascendant", "skills", "ascendant", "tools"),
];

// Manifests where host-provided modules must be peer-only.
const PEER_ONLY_MANIFESTS = ["packages/opencode-ascendant/package.json", ".opencode/package.json"];
const PEER_ONLY = ["effect", "@opencode/plugin", "@opencode/schema"];

const failures = [];

function listTsFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".d.ts")
    )
      out.push(full);
  }
  return out;
}

function checkSources() {
  for (const dir of SOURCE_DIRS) {
    for (const file of listTsFiles(dir)) {
      const rel = path.relative(ROOT_DIR, file);
      const text = fs.readFileSync(file, "utf-8");
      for (const match of text.matchAll(/from\s+["']([^"']+)["']/g)) {
        const spec = match[1];
        if (spec === BARREL || spec.startsWith(`${BARREL}/internal`)) {
          failures.push(
            `${rel}: imports "${spec}" — use a direct subpath (e.g. ${BARREL}/NodeFileSystem) so private effect/dist/* modules stay out of the plugin graph`,
          );
        }
        const effectDeep = spec.match(/^effect\/([^"']*\/[^"']*)$/);
        if (effectDeep) {
          failures.push(
            `${rel}: imports "${spec}" — OpenCode only provides public single-level effect/* subpaths; "${spec}" resolves to a blocked effect/dist/* file`,
          );
        }
      }
      for (const match of text.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
        const spec = match[1];
        if (spec === BARREL) {
          failures.push(
            `${rel}: dynamic import of "${spec}" barrel — import ${BARREL}/<SubModule> directly`,
          );
        }
        if (/^effect\/[^"']*\/[^"']*$/.test(spec)) {
          failures.push(
            `${rel}: dynamic import of "${spec}" — OpenCode only provides public single-level effect/* subpaths`,
          );
        }
      }
    }
  }
}

function checkManifests() {
  for (const rel of PEER_ONLY_MANIFESTS) {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, rel), "utf-8"));
    const deps = manifest.dependencies ?? {};
    for (const name of PEER_ONLY) {
      if (name in deps) {
        failures.push(
          `${rel}: "${name}" is a runtime dependency — it must be peer-only (provided by the OpenCode host)`,
        );
      }
    }
    const peers = manifest.peerDependencies ?? {};
    for (const name of PEER_ONLY) {
      if (!(name in peers)) {
        failures.push(`${rel}: "${name}" missing from peerDependencies`);
      }
    }
  }
}

/**
 * Verify the resolved dist closure of every directly-imported
 * `@effect/platform-node-shared/<Sub>` module: follow relative imports and
 * fail on any deep `effect/x/y` specifier, which the host blocks.
 * This catches regressions introduced by upgrading the dependency even when
 * sources only use direct subpaths.
 */
function checkDistClosure() {
  const platformDir = path.join(
    ROOT_DIR,
    ".opencode",
    "node_modules",
    "@effect",
    "platform-node-shared",
    "dist",
  );
  if (!fs.existsSync(platformDir)) {
    failures.push(
      ".opencode/node_modules/@effect/platform-node-shared/dist is missing — run install in .opencode first",
    );
    return;
  }
  const roots = new Set();
  for (const dir of SOURCE_DIRS.slice(0, 2)) {
    for (const file of listTsFiles(dir)) {
      const text = fs.readFileSync(file, "utf-8");
      for (const match of text.matchAll(/["']@effect\/platform-node-shared\/([^"']+)["']/g)) {
        roots.add(match[1]);
      }
    }
  }
  const visited = new Set();
  const visit = (distFile) => {
    if (visited.has(distFile)) return;
    visited.add(distFile);
    const text = fs.readFileSync(distFile, "utf-8");
    for (const match of text.matchAll(/from\s+"([^"]+)"/g)) {
      const spec = match[1];
      if (spec.startsWith("./") || spec.startsWith("../")) {
        const next = path.resolve(path.dirname(distFile), spec);
        if (fs.existsSync(next)) visit(next);
      } else if (/^effect\/[^"]*\/[^"]*$/.test(spec)) {
        failures.push(
          `${path.relative(ROOT_DIR, distFile)} imports "${spec}" — blocked by the OpenCode host (resolves to effect/dist/*)`,
        );
      }
    }
  };
  for (const sub of roots) {
    const entry = path.join(platformDir, `${sub}.js`);
    if (!fs.existsSync(entry)) {
      failures.push(
        `@effect/platform-node-shared/${sub} does not resolve to dist/${sub}.js — the direct-subpath import may be invalid`,
      );
      continue;
    }
    visit(entry);
  }
}

checkSources();
checkManifests();
checkDistClosure();

if (failures.length > 0) {
  console.error(`\nPlugin externals check failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(
  "✓ plugin externals: no barrel/deep effect imports, effect + @opencode/* are peer-only",
);
