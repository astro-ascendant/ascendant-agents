import { VERSION } from "./version.ts";

const argv = process.argv.slice(2);

if (argv.length === 1 && (argv[0] === "-v" || argv[0] === "-V" || argv[0] === "--version")) {
  process.stdout.write(`${VERSION}\n`);
} else {
  const { run } = await import("./cli.ts");
  const BunRuntime = await import("@effect/platform-bun/BunRuntime");
  run(argv).pipe(BunRuntime.runMain);
}
