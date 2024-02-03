import { HARVESTER } from "../../lib/Roles/Role.Harvester";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { HarvestAction } from "../../lib/Actions/Creep/Action.Harvest";
import { countBy, defaultsDeep, flatten, sortBy } from "lodash";
import { ProvinceMission, ProvinceMissionMemory } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { BuildAction } from "../../lib/Actions/Creep/Action.Build";
import { RepairAction } from "../../lib/Actions/Creep/Action.Repair";
import { SOURCE_HARVEST_PARTS } from "../../Constants";
import { log } from "../../utils/Logging/Logger";
import { FillAction } from "../../lib/Actions/Creep/Action.Fill";
import { move } from "screeps-cartographer";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";

interface MiningSiteMemory extends ProvinceMissionMemory {
}

const defaultMiningSiteMemory : MiningSiteMemory = {
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
    let sufficientWorkParts = (hs : Creep[]) => flatten(hs.map((c) => c.body.map((bpd) => bpd.type).filter((bt) : bt is WORK => bt === WORK))).length >= SOURCE_HARVEST_PARTS;

    let creeps: Creep[] = [];
    let creepCount = 0;
    let requestAmount = 0;
    do {
      requestAmount++
      creepCount = creeps.length;
      creeps = this.province.RequestCreeps(HARVESTER, requestAmount, this.memory.Id, this.priority / requestAmount, false);
    } while(!sufficientWorkParts(creeps) && creeps.length > creepCount);

    if(!this.container)
    {
      this.resolveContainer();
      if(!this.container)
      {
        this.miningPos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }

    //Deliberately (b - a) to force descending order
    creeps.sort((a,b) => countBy(b.body,(bpd) => bpd.type)[WORK] - countBy(a.body,(bpd) => bpd.type)[WORK])
      .sort((a,b) => a.pos.getRangeTo(this.miningPos) - b.pos.getRangeTo(this.miningPos));

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
            } else if(!onMiningPos)
            {
              let adjacent = true;
              if(!creep.pos.isNearTo(this.miningPos))
              {
                adjacent = false;
              }
              let move = new MoveAction(this.miningPos,1);
              let deposit = new FillAction(container,RESOURCE_ENERGY,creep);
              let returnMove = new MoveAction(creep.pos,0,true);
              if(!adjacent) {plan.prepend(returnMove);}
              plan.prepend(deposit);
              if(!adjacent) {plan.prepend(move);}
            }
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
        } else
        {
          let move = new MoveAction(this.pos,1,false);
          plan.append(move);
        }

      }

      let source = Game.getObjectById(this.source);
      if(source && source.energy === 0)
      {
        plan.prepend(new IdleAction());
        continue;
      }

      let harvest = new HarvestAction(this.source);
      plan.append(harvest);
    }
  }
}

