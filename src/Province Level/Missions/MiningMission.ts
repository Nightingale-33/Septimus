import { HARVESTER } from "../../lib/Roles/Role.Harvester";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { HarvestAction } from "../../lib/Actions/Creep/Action.Harvest";
import { defaultsDeep } from "lodash";
import { ProvinceMission, ProvinceMissionMemory } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { BuildAction } from "../../lib/Actions/Creep/Action.Build";
import { RepairAction } from "../../lib/Actions/Creep/Action.Repair";
import { SOURCE_HARVEST_PARTS } from "../../Constants";
import { log } from "../../utils/Logging/Logger";
import { FillAction } from "../../lib/Actions/Creep/Action.Fill";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";

interface MiningSiteMemory extends ProvinceMissionMemory {
}

const defaultMiningSiteMemory : MiningSiteMemory = {
  Id: "",
};

export class MiningMission extends ProvinceMission
{
  memory: MiningSiteMemory;

  get visibility(): boolean {return this.source !== null;}

  sourceId: Id<Source>;
  get source() : Source | null { return Game.getObjectById(this.sourceId);}
  pos: RoomPosition;
  containerId: Id<StructureContainer> | Id<ConstructionSite> | undefined;
  get container() : StructureContainer | ConstructionSite | null | undefined { if(!this.containerId) {return undefined;} else {return Game.getObjectById(this.containerId);} }

  miningPos: RoomPosition;
  maxMiners : number = 1;

  priority:number = 10;

  static GetFlagColours() : {primary: ColorConstant, secondary: ColorConstant}
  {
    return {primary:COLOR_GREY,secondary:COLOR_YELLOW};
  }

  constructor(flag : Flag, province : Province) {
    super(flag,province);

    this.sourceId = flag.name.split('_',2)[1] as Id<Source>;
    this.pos = flag.pos;

    defaultsDeep(this.memory,defaultMiningSiteMemory);
    this.resolveContainer();
    this.miningPos = this.resolveMiningPos();


  }

  private resolveMiningPos() : RoomPosition
  {
    if(this.container)
    {
      return this.container.pos;
    }

    let originPos = this.province.storage ? this.province.storage.pos : this.province.spawns[0].pos;
    let path = PathFinder.search(originPos,{pos: this.pos, range:1},{swampCost:1,plainCost:1});
    return path.path[path.path.length - 1];
  }

  private resolveContainer() {
    if(this.container)
    {
      return;
    }

    if(!this.visibility)
    {
      return;
    }

    let containers = this.pos.findInRange(FIND_STRUCTURES,1).filter((s) : s is StructureContainer => s.structureType === STRUCTURE_CONTAINER);
    if(containers.length > 0)
    {
      this.containerId = containers[0].id;
      return;
    }
    let containerConstruction = this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES,1).filter((cs) => cs.structureType === STRUCTURE_CONTAINER);
    if(containerConstruction.length > 0)
    {
      this.containerId = containerConstruction[0].id;
      return;
    }
    this.containerId = undefined;
  }

  run() : void {
    let creeps = this.province.RequestParts([HARVESTER],WORK,SOURCE_HARVEST_PARTS+1,this.memory.Id,this.priority);

    if(this.container === undefined)
    {
      this.resolveContainer();
      if(this.container === undefined)
      {
        this.miningPos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }


    let miningPosClaimed = false;
    for (const creep of creeps)
    {
      let onMiningPos = false;
      if(creep.pos.isEqualTo(this.miningPos))
      {
        miningPosClaimed = true;
        onMiningPos = true;
      }
      let plan = creep.memory.plan;
      if(plan.peek() instanceof IdleAction)
      {
        plan.clear(creep);
      }
      if(!plan.isEmpty())
      {
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && this.container)
        {
            log(10,`Creep: ${creep.name} is full and there's a container`);
            if(this.container instanceof ConstructionSite)
            {
              log(10,`Creep: ${creep.name} is helping build the container`);
              let build = new BuildAction(this.container,creep);
              plan.prepend(build);
            } else if(this.container.hits < this.container.hitsMax)
            {
              log(10,`Creep: ${creep.name} is helping repair the container`);
              let repair = new RepairAction(this.container,creep);
              plan.prepend(repair);
            } else if(!onMiningPos)
            {
              log(10,`Creep: ${creep.name} is helping fill the container`);
              let deposit = new FillAction(this.container,RESOURCE_ENERGY,creep);
              plan.prepend(deposit);
            }
        }
        continue;
      }

      if(!creep.pos.isNearTo(this.pos))
      {
        if(!miningPosClaimed)
        {
          let move = new MoveAction(this.miningPos,0,true);
          plan.append(move);
          miningPosClaimed = true;
        }
      }

      if(this.source && this.source.energy === 0)
      {
        plan.prepend(new IdleAction());
        continue;
      }

      let harvest = new HarvestAction(this.sourceId,this.pos);
      plan.append(harvest);
    }
  }
}

