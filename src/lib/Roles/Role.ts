import { HARVESTER } from "./Role.Harvester";
import { WORKER } from "./Role.Worker";
import { HAULER } from "./Role.Hauler";

declare global {
  interface CreepMemory {
    role: Role
  }
}

export type Role =
  typeof HARVESTER |
  typeof WORKER |
  typeof HAULER;
