import { ErrorMapper } from "utils/ErrorMapper";
import { TIME_FLAG } from "./utils/Logging/FlagDecs";
import { log } from "./utils/Logging/Logger";
import { Empire } from "./Empire Level/Empire";
import { MemHackWrapLoop } from "./utils/Memory/MemHack";

console.log("GLOBAL RESET");

let empire :Empire | undefined = undefined;

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = MemHackWrapLoop(ErrorMapper.wrapLoop(() => {
  log(TIME_FLAG,`Current game tick is ${Game.time}`);

  if(!empire)
  {
    empire = new Empire();
  }

  if(!empire.Initialised)
  {
    empire.Initialise();
  }
}));
