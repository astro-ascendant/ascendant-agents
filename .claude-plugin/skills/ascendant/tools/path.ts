import * as NodePath from "node:path";
import * as NodeUrl from "node:url";
import { Effect, Layer, Option, Path } from "effect";
import { BadArgument } from "effect/PlatformError";

/**
 * Host `Path` service for Bun (Bun implements the `node:path`/`node:url`
 * modules, so this runs wherever Bun runs).
 *
 * Why this exists instead of `@effect/platform-bun/BunPath`: BunPath is a
 * thin re-export of `@effect/platform-node-shared/NodePath`, whose 4.x
 * build does `import { make } from "effect/Path"`. The OpenCode host's
 * `effect` (4.0.0-beta.x) has no `make` export, so merely importing that
 * module fails the whole plugin load with
 * `Export named 'make' not found in module 'effect/Path'`.
 * This layer only touches public single-level `effect/*` modules plus
 * Bun's `node:` builtins, so the host serves every import.
 */
const fromFileUrl = (url: URL): Effect.Effect<string, BadArgument> =>
  Effect.try({
    try: () => NodeUrl.fileURLToPath(url),
    catch: (cause) =>
      new BadArgument({
        module: "Path",
        method: "fromFileUrl",
        cause,
      }),
  });

const toFileUrl = (path: string): Effect.Effect<URL, BadArgument> =>
  Effect.try({
    try: () => NodeUrl.pathToFileURL(path),
    catch: (cause) =>
      new BadArgument({
        module: "Path",
        method: "toFileUrl",
        cause,
      }),
  });

const PathService: Path.Path = {
  [Path.TypeId]: Path.TypeId,
  sep: NodePath.sep,
  basename: NodePath.basename,
  dirname: NodePath.dirname,
  extname: NodePath.extname,
  format: NodePath.format,
  fromFileUrl,
  isAbsolute: NodePath.isAbsolute,
  join: NodePath.join,
  normalize: NodePath.normalize,
  parse: NodePath.parse,
  relative: NodePath.relative,
  resolve: NodePath.resolve,
  // Mirrors `make` from `effect/Path`: derive `resolveWithin` from the
  // implementation above instead of importing `make` (absent on host).
  resolveWithin(root, input) {
    if (NodePath.parse(input).root !== "") return Option.none();
    const base = NodePath.resolve(root);
    const candidate = NodePath.resolve(base, input);
    const relative = NodePath.relative(base, candidate);
    return relative === ".." ||
      relative.startsWith(`..${NodePath.sep}`) ||
      NodePath.isAbsolute(relative)
      ? Option.none()
      : Option.some(candidate);
  },
  toFileUrl,
  toNamespacedPath: NodePath.toNamespacedPath,
};

export const PathLive: Layer.Layer<Path.Path> = Layer.succeed(Path.Path)(PathService);
