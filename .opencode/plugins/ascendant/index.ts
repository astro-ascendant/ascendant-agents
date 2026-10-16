// Import BunFileSystem via direct subpath, never the package barrel:
// the barrel re-exports socket/cluster modules that import private
// `effect/*/*` paths, which OpenCode does not provide to plugins
// (plugin load fails with `Cannot load "effect/dist/..." from plugin
// node_modules`). Only public single-level `effect/*` subpaths are allowed.
// Path comes from the shared skill layer (BunPath is unusable: it needs
// `make`, which the host's `effect/Path` does not export).
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import { Plugin } from "@opencode/plugin/effect";
import { Effect, Layer, Scope, Semaphore } from "effect";

import { PathLive } from "../../../skills/ascendant/tools/path.ts";
import { registerCommand } from "./command.ts";
import { makeDirectoryRunner } from "./directory.ts";
import { registerSkill } from "./skill.ts";
import { registerTools } from "./tools.ts";

const FileSystemLive = Layer.mergeAll(BunFileSystem.layer, PathLive);

export default Plugin.define({
  id: "ascendant",
  effect: (ctx): Effect.Effect<void, never, Scope.Scope> =>
    Effect.gen(function* () {
      const directory: string = ctx.location.directory;
      const directoryMutex = yield* Semaphore.make(1);
      const runInDirectory = makeDirectoryRunner(directoryMutex, directory);

      const skillDescription = yield* registerSkill(ctx);
      yield* registerCommand(ctx, skillDescription);
      yield* registerTools(ctx, runInDirectory);
    }).pipe(Effect.provide(FileSystemLive), Effect.orDie),
});
