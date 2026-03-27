import { HARVESTER } from "./Role.Harvester";
import { WORKER } from "./Role.Worker";
import { HAULER } from "./Role.Hauler";
import { SCOUT } from "./Role.Scout";
import { CLAIMER } from "./Role.Claimer";
import { LEGIONNAIRE } from "./Combat/Role.Legionnaire";
import { SPEARMAN } from "./Combat/Role.Spearman";

declare global {
  interface CreepMemory {
    role: Role
  }
}

export type Role =
  typeof HARVESTER |
  typeof WORKER |
  typeof HAULER |
  typeof SCOUT |
  typeof CLAIMER |
  CombatRole;

export type CombatRole =
  typeof LEGIONNAIRE |
  typeof SPEARMAN
