import { Mission, MissionMemory } from "../lib/Mission/Mission";
import { HARVESTER } from "../lib/Roles/Role.Harvester";
import { MoveAction } from "../lib/Actions/Creep/Action.Move";
import { HarvestAction } from "../lib/Actions/Creep/Action.Harvest";
import { defaultsDeep, filter } from "lodash";
import { ProvinceMission } from "../lib/Mission/ProvinceMission";
import { Province } from "./Province";
import { GetRandomId } from "../utils/StringUtils";
import { log } from "../utils/Logging/Logger";
import { BuildAction } from "../lib/Actions/Creep/Action.Build";

interface MiningSiteMemory extends MissionMemory {
  assignedCreep: Id<Creep> | undefined
}

const defaultMiningSiteMemory : MiningSiteMemory = {
  assignedCreep: undefined,
  Id: "",
};

export class MiningMission extends ProvinceMission
{
  memory: MiningSiteMemory;

  source: Id<Source>;
  pos: RoomPosition;
  container: Id<StructureContainer> | Id<ConstructionSite> | undefined;

  miningPos: RoomPosition;


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

  run() {
    if(this.memory.assignedCreep === undefined)
    {
      let unassignedHarvester = this.province.creeps.find((c) => {
        return c.memory.role === HARVESTER && c.memory.missionId === undefined;});
      if(unassignedHarvester == undefined)
      {
        if(!this.province.memory.SpawnRequests.find((r) => r.id === this.memory.Id))
        {
          this.province.memory.SpawnRequests.push({id: this.memory.Id,role:HARVESTER,priority:1});
        }
        return;
      } else
      {
        this.memory.assignedCreep = unassignedHarvester.id;
        unassignedHarvester.memory.missionId = this.memory.Id;
        log(3,`Claiming Harvester: ${unassignedHarvester.name}`);
      }
    }

    //Check the creep exists
    let creep = Game.getObjectById(this.memory.assignedCreep);
    if(!creep)
    {
      this.memory.assignedCreep = undefined;
      return run();
    }

    let plan = creep.memory.plan;
    if(!plan.isEmpty())
    {
      //Should be fine
      return;
    }

    if(!creep.pos.isNearTo(this.pos))
    {
      let move = new MoveAction(this.miningPos,0,true);
      plan.append(move);
    }

    if(!this.container)
    {
      this.resolveContainer();
      if(!this.container)
      {
        this.miningPos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    } else
    {
      let container = Game.getObjectById(this.container);
      if(container instanceof ConstructionSite)
      {
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0)
        {
          let build = new BuildAction(container,creep);
          plan.prepend(build);
        }
      }
    }

    let harvest = new HarvestAction(this.source);
    plan.append(harvest);
    return;
  }
}

