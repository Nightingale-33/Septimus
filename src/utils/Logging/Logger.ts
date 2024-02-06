import { isNumber, isString, remove } from "lodash";
import { LOG_FLAG } from "./FlagDecs";

declare global {
  interface Memory {
    logLevel: number;
    logFlags: LOG_FLAG[];
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      SetAuditLevel(level: number): boolean;
      SetAuditFlag(flag: LOG_FLAG): boolean;
      AuditFlagSet(flag: LOG_FLAG): boolean;
      ClearAuditFlag(flag: LOG_FLAG):boolean;
    }
  }
}

export function log(logLevel: number | LOG_FLAG, message: string) {
  if(isNumber(logLevel))
  {
    if(Memory.logLevel === undefined)
    {
      Memory.logLevel = 1;
    }
    if(Memory.logLevel < logLevel)
    {
      return;
    }
  } else
  {
    if(Memory.logFlags === undefined)
    {
      Memory.logFlags = [];
    }
    if(!Memory.logFlags.includes(logLevel))
    {
      return;
    }
  }

  let messageToPrint = `${logLevel} : ${message}`;
  console.log(messageToPrint);
}

global.SetAuditLevel = function(logLevel : number) {
  Memory.logLevel = Math.min(10,Math.max(0,logLevel));
  return true;
}

global.SetAuditFlag = function(flag: LOG_FLAG) {
  if(!Memory.logFlags.includes(flag))
  {
    Memory.logFlags.push(flag);
    return true;
  }
  return false;
}

global.AuditFlagSet = function(flag: LOG_FLAG) : boolean {
  return Memory.logFlags.includes(flag);
}

global.ClearAuditFlag = function(flag: LOG_FLAG) {
  return remove(Memory.logFlags,(f) => f == flag).length > 0;
}
