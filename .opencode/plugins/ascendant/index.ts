import { NodeFileSystem, NodePath } from "@effect/platform-node-shared";
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
