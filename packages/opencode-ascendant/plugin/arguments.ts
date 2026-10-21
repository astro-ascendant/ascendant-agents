import type { CheckTransitInput, AddPersonInput } from "./inputs.ts";

export function addPersonArgs(args: typeof AddPersonInput.Type): ReadonlyArray<string> {
  return [
    "--name",
    args.name,
    "--moment",
    args.moment,
    "--latitude",
    String(args.latitude),
    "--longitude",
    String(args.longitude),
    ...(args.sex !== undefined ? ["--sex", args.sex] : []),
  ];
}

export function transitArgs(args: typeof CheckTransitInput.Type): ReadonlyArray<string> {
  return [
    "--name",
    args.name,
    "--moment",
    args.moment,
    "--planet",
    args.planet,
    ...(args.school !== undefined ? ["--school", args.school] : []),
    ...(args.direction !== undefined ? ["--direction", args.direction] : []),
    ...(args.kinds !== undefined && args.kinds.length > 0 ? ["--kinds", args.kinds.join(",")] : []),
    ...(args.count !== undefined ? ["--count", String(args.count)] : []),
    ...(args.targetLongitude !== undefined
      ? ["--target-longitude", String(args.targetLongitude)]
      : []),
    ...(args.house !== undefined ? ["--house", String(args.house)] : []),
    ...(args.maxYears !== undefined ? ["--max-years", String(args.maxYears)] : []),
    ...(args.precisionMinutes !== undefined
      ? ["--precision-minutes", String(args.precisionMinutes)]
      : []),
  ];
}
