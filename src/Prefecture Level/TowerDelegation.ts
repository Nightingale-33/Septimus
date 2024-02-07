import { Delegation } from "../lib/Delegation";
import { Prefecture } from "./Prefecture";
import { Province } from "../Province Level/Province";
import { min } from "lodash";
import { log } from "../utils/Logging/Logger";

export class TowerDelegation extends Delegation
{
  name: string = "Towers";
  get Id(): string { return `${this.prefecture.RoomName}_${this.name}`}

  province : Province;
  prefecture : Prefecture;

  constructor(province : Province, prefecture : Prefecture) {
    super();
    this.province = province;
    this.prefecture = prefecture;
  }

  ShouldExecute(): boolean {
    return this.prefecture.towers.length > 0;
  }
  Execute(): void {
    //Hostile first
    let hostiles = this.prefecture.room.find(FIND_HOSTILE_CREEPS);
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
      //Not murder
      for(const tower of this.prefecture.towers)
      {
        let towerUsed = tower.store.getUsedCapacity(RESOURCE_ENERGY);
        let towerFree = tower.store.getFreeCapacity(RESOURCE_ENERGY);
        log(6,`Tower: ${tower.id} has: ${towerUsed}/${tower.store.getCapacity(RESOURCE_ENERGY)} energy`);
        if(this.province.Repairing.repairables.length === 0 || (towerUsed ?? 0) < (towerFree ?? 0))
        {
          return;
        }
        let nearbyRepair = min(this.province.Repairing.repairables,(r) => r.pos.getRangeTo(tower.pos));
        if(nearbyRepair && nearbyRepair.pos && nearbyRepair.pos.inRangeTo(tower.pos,10))
        {
          tower.repair(nearbyRepair);
        }
      }
    }
  }
}
