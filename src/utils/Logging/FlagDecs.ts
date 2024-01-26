export const PROFILING_FLAG = "P";
export const TRACE_FLAG = "T";
export const JSON_FLAG  = "J";
export const TIME_FLAG = "Q"

export type LOG_FLAG =
  | typeof PROFILING_FLAG
  | typeof TRACE_FLAG
  | typeof JSON_FLAG
  | typeof TIME_FLAG;
