// Import NodeFileSystem/NodePath via direct subpaths, never the package
// barrel: the barrel re-exports socket/cluster modules that import the
// private `effect/net/*` paths, which OpenCode does not provide to plugins
// (plugin load fails with `Cannot load "effect/dist/..." from plugin
// node_modules`). Only public single-level `effect/*` subpaths are allowed.
import * as NodeFileSystem from "@effect/platform-node-shared/NodeFileSystem";
import * as NodePath from "@effect/platform-node-shared/NodePath";
import { Plugin } from "@opencode/plugin/effect";
import { Effect, Layer, Scope, Semaphore } from "effect";

import { registerCommand } from "./command.ts";
import { makeDirectoryRunner } from "./directory.ts";
import { registerSkill } from "./skill.ts";
import { registerTools } from "./tools.ts";

const FileSystemLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);

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
