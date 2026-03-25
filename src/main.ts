import { TIME_FLAG } from "./utils/Logging/FlagDecs";
import { log } from "./utils/Logging/Logger";
import { Empire } from "./Empire Level/Empire";
import { MemHackWrapLoop } from "./utils/Memory/MemHack";
import { Profile } from "./utils/Profiler/SimpleProfile";
import { CacheManager } from "./utils/CacheManager";
import { CartographerWrapLoop } from "./utils/Movement/MovementWrapper";
import * as Stats from "./utils/stats";

console.log("GLOBAL RESET");

declare global {
  namespace NodeJS {
    interface Global {
      empire: Empire;
      cache: CacheManager;
    }
  }
}

global.empire = new Empire();
global.cache = new CacheManager();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = Profile("Main Loop",() => MemHackWrapLoop(CartographerWrapLoop(() => {
  log(TIME_FLAG,`Current game tick is ${Game.time}`);

  Profile(`Empire Initialisation`, () => global.empire.Initialise());

  Profile(`Empire Run`, () => global.empire.Run());

  Profile(`Empire Tidy`, () => global.empire.Tidy());

  Stats.exportStats();

  if (Game.cpu.bucket >= PIXEL_CPU_COST && Game.cpu.generatePixel != undefined) {
    log(3, "Generating pixel");
    let result = Game.cpu.generatePixel();
    if (result == OK) {
      log(2, "Generated pixel");
    }
  }
})));
