import type { Plugin } from "@opencode/plugin/effect";
import { Effect } from "effect";

export const registerCommand = Effect.fn("Ascendant.registerCommand")(function* (
  ctx: Plugin.Context,
  skillDescription: string,
) {
  yield* ctx.command.transform((editor) => {
    editor.add({
      name: "ascendant",
      description: `${skillDescription} (add | setup | analysis)`,
      execute: (input) =>
        ctx.session
          .prompt({
            sessionID: input.sessionID,
            text: `Call skill({ name: "ascendant" }) and follow its \`Dispatch\` and \`Readings\` sections to handle ${input.prompt.text}.`,
            delivery: input.delivery,
          })
          .pipe(Effect.asVoid),
    });
  });
});
