import { Delegation } from "../lib/Delegation";
import { Prefecture } from "./Prefecture";
import { Province } from "../Province Level/Province";
import { any, min } from "lodash";
import { log } from "../utils/Logging/Logger";
import { RepairReservation } from "../lib/Reservations/RepairReservations";

export class TowerDelegation extends Delegation
{
  name: string = "Towers";
  get Id(): string { return `${this.prefecture.RoomName}_${this.name}`}

  province : Province;
  prefecture : Prefecture;

  constructor(prefecture : Prefecture) {
    super();
    this.province = prefecture.province;
    this.prefecture = prefecture;
  }

  ShouldExecute(): boolean {
    return this.prefecture.towers.length > 0;
  }
  Execute(): void {
    //Hostile first
    let hostiles = this.prefecture.room.find(FIND_HOSTILE_CREEPS).filter(hostile => hostile.body.filter(c => c.hits > 0 && (c.type == WORK || c.type == ATTACK || c.type == RANGED_ATTACK || c.type == HEAL)).length > 0);
    if(hostiles.length > 0)
    {
      //Murder
      for(const tower of this.prefecture.towers)
      {
        let target = min(hostiles,(h) => h.pos.getRangeTo(tower.pos));
        tower.attack(target);
      }

    } else
    {
      //Heal before Repair
      let damagedCreeps = this.province.creeps.filter((c) => c.pos.roomName === this.prefecture.RoomName && any(c.body, (bpd) => bpd.hits < 100));

      //Not murder
      for(const tower of this.prefecture.towers)
      {
        let towerUsed = tower.store.getUsedCapacity(RESOURCE_ENERGY);
        let towerFree = tower.store.getFreeCapacity(RESOURCE_ENERGY);
        log(6,`Tower: ${tower.id} has: ${towerUsed}/${tower.store.getCapacity(RESOURCE_ENERGY)} energy`);
        if(damagedCreeps.length > 0)
        {
          let closest = min(damagedCreeps,(c) => c.pos.getRangeTo(tower.pos));
          tower.heal(closest);
          continue;
        }

        let validRepairs = this.province.Repairing.repairables.filter((r) => (r.structureType === STRUCTURE_ROAD || r.pos.getRangeTo(tower.pos) <= 10) && RepairReservation.GetPostReservationHits(r) < r.hitsMax);
        if(validRepairs.length === 0 || (towerUsed ?? 0) < (towerFree ?? 0))
        {
          continue;
        }
        let nearbyRepair = min(validRepairs,(r) => r.pos.getRangeTo(tower.pos));
        if(nearbyRepair)
        {
          tower.repair(nearbyRepair);
          continue;
        }
      }
    }
  }
}
