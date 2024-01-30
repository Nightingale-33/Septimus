import { HARVESTER } from "./Role.Harvester";

declare global {
  interface CreepMemory {
    role: Role
  }
}

export type Role =
  typeof HARVESTER;
