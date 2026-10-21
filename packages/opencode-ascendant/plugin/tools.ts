import type { Plugin } from "@opencode/plugin/effect";
import { encode } from "@toon-format/toon";
import { Swisseph } from "astro-ascendant";
import { Effect, Layer } from "effect";

import { addPersonWorkflow, transitWorkflow } from "../skills/ascendant/tools/cli.ts";
import {
  AppLayer,
  KpAstroParamsLayer,
  PlatformLayer,
} from "../skills/ascendant/tools/common.ts";
import { addPersonArgs, transitArgs } from "./arguments.ts";
import { makeDirectoryRunner } from "./directory.ts";
import { toToolError } from "./errors.ts";
import { CheckTransitInput, AddPersonInput } from "./inputs.ts";

const TOOL_TIMEOUT_MS = 60_000;

export const registerTools = Effect.fn("Ascendant.registerTools")(function* (
  ctx: Plugin.Context,
  runInDirectory: ReturnType<typeof makeDirectoryRunner>,
) {
  yield* ctx.tool.transform((editor) => {
    editor.add({
      name: "ascendant_add_person",
      description: "Create or refresh one saved astrology record from exact birth data.",
      input: AddPersonInput,
      execute: (args) =>
        runInDirectory(
          addPersonWorkflow(addPersonArgs(args)).pipe(
            Effect.provide(AppLayer),
            Effect.map((output) => ({ content: encode(output) })),
          ),
        ).pipe(Effect.timeout(TOOL_TIMEOUT_MS), Effect.mapError(toToolError)),
    });
    editor.add({
      name: "ascendant_check_transit",
      description: "Search transit events for one saved person and moment.",
      input: CheckTransitInput,
      execute: (args) => {
        const layer =
          args.school === "kp"
            ? Layer.mergeAll(PlatformLayer, KpAstroParamsLayer, Swisseph.SwissephLayer)
            : AppLayer;
        return runInDirectory(
          transitWorkflow(transitArgs(args)).pipe(
            Effect.provide(layer),
            Effect.map((output) => ({ content: encode(output) })),
          ),
        ).pipe(Effect.timeout(TOOL_TIMEOUT_MS), Effect.mapError(toToolError));
      },
    });
  });
});
