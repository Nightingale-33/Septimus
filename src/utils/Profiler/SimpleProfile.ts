import { log } from "../Logging/Logger";
import { PROFILING_FLAG } from "../Logging/FlagDecs";


export function Profile<T>(name : string,func: () => T) : T
{
  if(global.AuditFlagSet(PROFILING_FLAG))
  {
    let timePre = Game.cpu.getUsed();
    let result = func();
    let timePost = Game.cpu.getUsed();
    log(PROFILING_FLAG, `${name}: ${timePost - timePre} CPU`);
    return result;
  } else
  {
    return func();
  }

}
