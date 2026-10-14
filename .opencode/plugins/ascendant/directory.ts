import { Effect, Semaphore } from "effect";

import { describeCause } from "./errors.ts";

/**
 * Serialize working-directory-sensitive runs: the workflows resolve
 * `persons/` against the process cwd, so concurrent calls for different
 * projects must not interleave a shared chdir.
 */
export function makeDirectoryRunner(mutex: Semaphore.Semaphore, directory: string) {
  return <A, E>(effect: Effect.Effect<A, E, never>): Effect.Effect<A, E | Error, never> =>
    Semaphore.withPermits(
      mutex,
      1,
    )(
      Effect.acquireUseRelease(
        Effect.try(() => {
          const previous = process.cwd();
          if (previous !== directory) process.chdir(directory);
          return previous;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new Error(`Unable to use working directory ${directory}: ${describeCause(cause)}`),
          ),
        ),
        () => effect,
        (previous) =>
          Effect.sync(() => {
            if (process.cwd() !== previous) process.chdir(previous);
          }),
      ),
    );
}
