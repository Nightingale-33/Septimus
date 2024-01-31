import { HARVESTER } from "./Role.Harvester";
import { WORKER } from "./Role.Worker";

declare global {
  interface CreepMemory {
    role: Role
  }
}

export type Role =
  typeof HARVESTER |
  typeof WORKER;
