#!/usr/bin/env node
/**
 * Build the publishable `opencode-ascendant` npm package from repo sources.
 *
 * Sources:  .opencode/plugins/ascendant/*.ts (plugin modules)
 *           skills/ascendant/ (skill tree: SKILL.md + subtrees)
 *           package.json + .opencode/package.json (versions and dep pins)
 * Output:   packages/opencode-ascendant/ (tracked; entry `plugin/index.ts`)
 *
 * The plugin sources address the skill tree as `../../../skills/...`
 * (repo layout). Inside the package the tree sits at `../skills/...`,
 * so that prefix is rewritten on copy. Dependency pins and the package
 * version are stamped from the manifests on every run, so the published
 * artifact can never drift from what the repo tests.
 *
 * Run: `node scripts/build-opencode-plugin.mjs [--check]`.
 * `--check` builds to a temp dir and fails when the tracked output differs.
 * No dependencies.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PLUGIN_SRC_DIR = path.join(ROOT_DIR, ".opencode", "plugins", "ascendant");
const SKILL_SRC_DIR = path.join(ROOT_DIR, "skills", "ascendant");
const DEST_DIR = path.join(ROOT_DIR, "packages", "opencode-ascendant");

// Subtrees mirrored verbatim from the skill source (SKILL.src.md excluded;
// the built canonical SKILL.md is copied as SKILL.md instead).
const SKILL_SUBTREES = ["instructions", "references", "scripts", "tools", "agents"];

// Repo-relative prefix used by plugin sources -> package-relative prefix.
const SRC_SKILL_PREFIX = "../../../skills";
const DEST_SKILL_PREFIX = "../skills";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function stripRange(spec) {
  return String(spec).replace(/^[~^]/, "");
}

function caret(spec) {
  return `^${stripRange(spec)}`;
}

function copyDirPreservingModes(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirPreservingModes(src, dest);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".test.ts")) continue;
      fs.copyFileSync(src, dest);
      fs.chmodSync(dest, fs.statSync(src).mode & 0o777);
    }
  }
}

function copyPluginSources(destPluginDir) {
  fs.mkdirSync(destPluginDir, { recursive: true });
  for (const entry of fs.readdirSync(PLUGIN_SRC_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const text = fs
      .readFileSync(path.join(PLUGIN_SRC_DIR, entry.name), "utf-8")
      .split(SRC_SKILL_PREFIX)
      .join(DEST_SKILL_PREFIX);
    if (text.includes("../..")) {
      throw new Error(
        `${entry.name} contains a relative path escaping packages/opencode-ascendant/ after rewrite; refusing to copy`,
      );
    }
    fs.writeFileSync(path.join(destPluginDir, entry.name), text, "utf-8");
  }
}

function copySkillTree(destSkillDir) {
  const canonical = path.join(SKILL_SRC_DIR, "SKILL.md");
  if (!fs.existsSync(canonical)) throw new Error(`Missing canonical skill: ${canonical}`);
  fs.mkdirSync(destSkillDir, { recursive: true });
  fs.copyFileSync(canonical, path.join(destSkillDir, "SKILL.md"));
  for (const tree of SKILL_SUBTREES) {
    const src = path.join(SKILL_SRC_DIR, tree);
    if (!fs.existsSync(src)) throw new Error(`Missing skill subtree: ${src}`);
    copyDirPreservingModes(src, path.join(destSkillDir, tree));
  }
}

function stampManifest(destDir) {
  const root = readJson(path.join(ROOT_DIR, "package.json"));
  const opencode = readJson(path.join(ROOT_DIR, ".opencode", "package.json"));
  const manifestPath = path.join(destDir, "package.json");
  const manifest = readJson(manifestPath);
  manifest.version = root.version;
  // Runtime dependencies only. `effect` and `@opencode/*` are provided by
  // the OpenCode host at plugin load (it redirects those imports to its own
  // runtime instances), so they must stay peer-only: shipping them would
  // load a second Effect copy or a private `effect/dist/*` path and fail.
  manifest.dependencies = {
    "@effect/platform-node-shared": caret(root.dependencies["@effect/platform-node-shared"]),
    "@toon-format/toon": caret(root.dependencies["@toon-format/toon"]),
    "astro-ascendant": caret(root.dependencies["astro-ascendant"]),
  };
  manifest.peerDependencies = {
    "@opencode/plugin": caret(
      opencode.peerDependencies["@opencode/plugin"] ?? opencode.dependencies["@opencode/plugin"],
    ),
    "@opencode/schema": caret(
      opencode.peerDependencies["@opencode/schema"] ?? opencode.dependencies["@opencode/schema"],
    ),
    effect: caret(root.dependencies["effect"] ?? root.peerDependencies["effect"]),
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
}

function build(destRoot) {
  copyPluginSources(path.join(destRoot, "plugin"));
  copySkillTree(path.join(destRoot, "skills", "ascendant"));
  stampManifest(destRoot);
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile()) out.push(path.relative(base, full));
  }
  return out.sort();
}

function check() {
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-ascendant-"));
  // The tracked package.json template travels along so stamping compares fairly.
  fs.copyFileSync(path.join(DEST_DIR, "package.json"), path.join(staging, "package.json"));
  fs.copyFileSync(path.join(DEST_DIR, "README.md"), path.join(staging, "README.md"));
  build(staging);
  // package.json, README.md, CHANGELOG.md, and .gitignore are tracked
  // hand-written files, not build output; exclude them from the tree comparison.
  // (CHANGELOG.md is appended to by `changeset version` on future releases.)
  const authored = new Set(["package.json", "README.md", "CHANGELOG.md", ".gitignore"]);
  const expected = listFiles(staging).filter((f) => !authored.has(f));
  const actual = listFiles(DEST_DIR).filter((f) => !authored.has(f));
  const missing = expected.filter((f) => !actual.includes(f));
  const extra = actual.filter((f) => !expected.includes(f));
  const changed = expected.filter(
    (f) =>
      actual.includes(f) &&
      fs.readFileSync(path.join(staging, f)).toString() !==
        fs.readFileSync(path.join(DEST_DIR, f)).toString(),
  );
  const stagedManifest = readJson(path.join(staging, "package.json"));
  const trackedManifest = readJson(path.join(DEST_DIR, "package.json"));
  const manifestDrift =
    JSON.stringify(stagedManifest) !== JSON.stringify(trackedManifest) ? ["package.json"] : [];
  fs.rmSync(staging, { recursive: true, force: true });
  const problems = [
    ...missing.map((f) => `missing ${f}`),
    ...extra.map((f) => `extra ${f}`),
    ...changed.map((f) => `changed ${f}`),
    ...manifestDrift.map((f) => `changed ${f}`),
  ];
  if (problems.length > 0) {
    console.error(`\nBuild check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    console.error("Run `node scripts/build-opencode-plugin.mjs` and commit the result.");
    process.exit(1);
  }
  console.log("✓ packages/opencode-ascendant/ is in sync");
}

try {
  if (process.argv.includes("--check")) {
    check();
  } else {
    if (!fs.existsSync(path.join(DEST_DIR, "package.json"))) {
      throw new Error(`Missing package template: ${path.join(DEST_DIR, "package.json")}`);
    }
    build(DEST_DIR);
    const pkg = readJson(path.join(DEST_DIR, "package.json"));
    console.log(`✓ packages/opencode-ascendant/ (v${pkg.version})`);
  }
} catch (err) {
  console.error(`\nBuild failed: ${err.message}`);
  process.exit(1);
}
