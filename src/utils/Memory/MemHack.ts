import { customJSONReviver } from "./JSONReviver";
import { log } from "../Logging/Logger";
import { PROFILING_FLAG } from "../Logging/FlagDecs";

export function MemHackWrapLoop(loop: () => void)
{
  let memory : any;
  let tick : number;

  return () => {
    if (tick && tick + 1 === Game.time && memory)
    {
      // @ts-ignore
      delete global.Memory;
      // @ts-ignore
      global.Memory = memory;
    } else
    {
      let preParse = Game.cpu.getUsed();
      let customParsedMemory = JSON.parse(RawMemory.get(), customJSONReviver);

      // @ts-ignore
      delete global.Memory;
      // @ts-ignore
      global.Memory = memory = customParsedMemory;

      let postParse = Game.cpu.getUsed();
      log(PROFILING_FLAG, `Parsing cost: ${postParse - preParse} CPU`);
    }

    tick = Game.time;

    loop();

    RawMemory.set(JSON.stringify(Memory));
  };
}
