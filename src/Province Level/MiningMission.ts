import { HARVESTER } from "../lib/Roles/Role.Harvester";
import { MoveAction } from "../lib/Actions/Creep/Action.Move";
import { HarvestAction } from "../lib/Actions/Creep/Action.Harvest";
import { defaultsDeep } from "lodash";
import { ProvinceMission, ProvinceMissionMemory } from "../lib/Mission/ProvinceMission";
import { Province } from "./Province";
import { BuildAction } from "../lib/Actions/Creep/Action.Build";
import { RepairAction } from "../lib/Actions/Creep/Action.Repair";

interface MiningSiteMemory extends ProvinceMissionMemory {
}

const defaultMiningSiteMemory : MiningSiteMemory = {
  assignedCreeps: [],
  Id: "",
};

export class MiningMission extends ProvinceMission
{
  memory: MiningSiteMemory;

  source: Id<Source>;
  pos: RoomPosition;
  container: Id<StructureContainer> | Id<ConstructionSite> | undefined;

  miningPos: RoomPosition;
  maxMiners : number = 1;

  priority:number = 10;

  static GetFlagColours() : {primary: ColorConstant, secondary: ColorConstant}
  {
    return {primary:COLOR_GREY,secondary:COLOR_YELLOW};
  }

  constructor(flag : Flag, province : Province) {
    super(flag,province);

    this.source = flag.name.split('_',2)[1] as Id<Source>;
    this.pos = flag.pos;

    defaultsDeep(this.memory,defaultMiningSiteMemory);
    this.resolveContainer();
    this.miningPos = this.resolveMiningPos();


  }

  private resolveMiningPos() : RoomPosition
  {
    if(this.container)
    {
      let container = Game.getObjectById(this.container);
      if(container)
      {
        return container.pos;
      }
    }

    let originPos = this.province.storage ? this.province.storage.pos : this.province.spawns[0].pos;
    let path = PathFinder.search(originPos,{pos: this.pos, range:1});
    return path.path[path.path.length - 1];
  }

  private resolveContainer() {
    let containers = this.pos.findInRange(FIND_STRUCTURES,1).filter((s) : s is StructureContainer => s.structureType === STRUCTURE_CONTAINER);
    if(containers.length > 0)
    {
      this.container = containers[0].id;
      return;
    }
    let containerConstruction = this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES,1).filter((cs) => cs.structureType === STRUCTURE_CONTAINER);
    if(containerConstruction.length > 0)
    {
      this.container = containerConstruction[0].id;
      return;
    }
    this.container = undefined;
  }

  run() : void {
    let creeps = this.RequestCreeps({ "Harvester": 1 });
    if(creeps[HARVESTER].length === 0)
    {
      return;
    }

    if(!this.container)
    {
      this.resolveContainer();
      if(!this.container)
      {
        this.miningPos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }

    for (const creep of creeps[HARVESTER])
    {
      let plan = creep.memory.plan;
      if(!plan.isEmpty())
      {
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && this.container)
        {
          let container = Game.getObjectById(this.container);
          if(container)
          {
            if(container instanceof ConstructionSite)
            {
              let build = new BuildAction(container,creep);
              plan.prepend(build);
            } else if(container.hits < container.hitsMax)
            {
              let repair = new RepairAction(container,creep);
              plan.prepend(repair);
            }
          }

        }
        continue;
      }

      if(!creep.pos.isNearTo(this.pos))
      {
        let move = new MoveAction(this.miningPos,0,true);
        plan.append(move);
      }

      let harvest = new HarvestAction(this.source);
      plan.append(harvest);
    }
  }
}

