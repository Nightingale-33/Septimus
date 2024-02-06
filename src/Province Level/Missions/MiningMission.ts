import { HARVESTER } from "../../lib/Roles/Role.Harvester";
import { MoveAction } from "../../lib/Actions/Creep/Action.Move";
import { HarvestAction } from "../../lib/Actions/Creep/Action.Harvest";
import { defaultsDeep, sortBy } from "lodash";
import { ProvinceMission, ProvinceMissionMemory } from "../../lib/Mission/ProvinceMission";
import { Province } from "../Province";
import { BuildAction } from "../../lib/Actions/Creep/Action.Build";
import { RepairAction } from "../../lib/Actions/Creep/Action.Repair";
import { SOURCE_HARVEST_PARTS } from "../../Constants";
import { log } from "../../utils/Logging/Logger";
import { FillAction } from "../../lib/Actions/Creep/Action.Fill";
import { IdleAction } from "../../lib/Actions/Creep/Action.Idle";
import { CountParts } from "../../utils/CreepUtils";
import { ResourceReservation } from "../../lib/Reservations/ResourceReservations";
import { isEnterable } from "../../utils/MovementUtils";
import { RepairReservation } from "../../lib/Reservations/RepairReservations";
import { Behaviour, Planner } from "../../lib/Planning/Planner";
import { Action } from "lib/Action";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { DropAction } from "../../lib/Actions/Creep/Action.Drop";

interface MiningSiteMemory extends ProvinceMissionMemory {
}

const defaultMiningSiteMemory: MiningSiteMemory = {
  Id: ""
};

export class MiningMission extends ProvinceMission implements Behaviour {
  memory: MiningSiteMemory;

  get visibility(): boolean {
    return this.source !== null;
  }

  sourceId: Id<Source>;

  get source(): Source | null {
    return Game.getObjectById(this.sourceId);
  }

  pos: RoomPosition;
  containerId: Id<StructureContainer> | Id<ConstructionSite> | undefined;

  get container(): StructureContainer | ConstructionSite | null | undefined {
    if (!this.containerId) {
      return undefined;
    } else {
      return Game.getObjectById(this.containerId);
    }
  }

  miningPos: RoomPosition;
  maxMiners: number = 1;

  priority: number = 1000000;

  static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
    return { primary: COLOR_GREY, secondary: COLOR_YELLOW };
  }

  Planner : Planner;

  constructor(flag: Flag, province: Province) {
    let sourceId = flag.name.split("_", 2)[1] as Id<Source>;
    super(flag, province,`${province.name}_${sourceId}`);
    this.sourceId = sourceId;
    this.pos = flag.pos;
    this.Planner = new Planner(this,5);
    defaultsDeep(this.memory, defaultMiningSiteMemory);
    this.resolveContainer();
    this.miningPos = this.resolveMiningPos();
    this.maxMiners = this.resolveMaxMiners();
  }

  private resolveMaxMiners() : number
  {
    let max = 0;
    let room = this.source?.room;
    if(!room)
    {
      return 0;
    }
    //Count walkable
    for(let x = -1; x <= 1; ++x)
    {
      for(let y = -1; y <= 1; ++y)
      {
        if(x === 0 && y === 0)
        {
          continue;
        }

        let pos = room.getPositionAt(this.pos.x + x,this.pos.y + y);
        if(pos)
        {
          if(isEnterable(pos))
          {
            max++;
            continue;
          }
        }
      }
    }
    log(1,`There are: ${max} available spots around source: ${this.sourceId}`);
    return max;
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

  lastCreepsHad : number = 0;

  run() : void {
    let practicalMax = this.maxMiners;
    if(practicalMax <= 0)
    {
      this.maxMiners = this.resolveMaxMiners();
      practicalMax = Math.max(1,this.maxMiners);
    }

    let spawnPred = (province: Province) => {
      return this.lastCreepsHad === 0 || (province.Capital.room.energyAvailable / province.Capital.room.energyCapacityAvailable) >= 0.5;
    };
    let creeps = this.province.RequestParts([HARVESTER],WORK,SOURCE_HARVEST_PARTS+1,this.memory.Id, this.lastCreepsHad === 0 ? this.priority : this.priority - Math.pow(100,this.lastCreepsHad),{maxCreeps: practicalMax, stealCreeps: false, spawnPredicate:spawnPred});
    creeps = sortBy(creeps,(c) => CountParts(c)[WORK]);
    this.lastCreepsHad = creeps.length;
    log(7,`Received: ${this.lastCreepsHad}/${practicalMax} creeps for: ${this.sourceId}`);

    if(creeps.length === 0)
    {
      return;
    }

    //Claim the miningPos
    let claimingCreep = this.miningPosClaimed ? Game.getObjectById(this.miningPosClaimed) : null;
    if(!claimingCreep)
    {
      this.miningPosClaimed = undefined;
    }
    let biggestCreep = creeps[0];
    if(!this.miningPosClaimed || !claimingCreep)
    {
      this.miningPosClaimed = biggestCreep.id;
    } else if(CountParts(biggestCreep)[WORK] > CountParts(claimingCreep)[WORK])
    {
      this.miningPosClaimed = biggestCreep.id;
    }
    //else they are equally big so no fighting

    if(this.container === undefined)
    {
      this.resolveContainer();
      if(this.container === undefined)
      {
        this.miningPos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    }

    for (const creep of creeps)
    {
      this.Planner.Plan(creep);
    }
  }

  miningPosClaimed : Id<Creep> | undefined;

  Interrupt(creep: AbstractCreep): Action | null {
    let onMiningPos = creep.pos.isEqualTo(this.miningPos);
    let creepFree = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if(creepFree == 0 && this.container)
    {
      if(this.container instanceof ConstructionSite)
      {
        return new BuildAction(this.container,creep);
      } else if(RepairReservation.GetPostReservationHits(this.container) < this.container.hitsMax)
      {
        return new RepairAction(this.container,creep);
      } else if(!onMiningPos && ResourceReservation.GetPostReservationStore(this.container,RESOURCE_ENERGY).free > 0)
      {
        return new FillAction(this.container,RESOURCE_ENERGY,creep);
      }
    }
    return null;
  }

  PlanNext(creep: AbstractCreep): Action | null {
    if(!creep.pos.isNearTo(this.pos))
    {
      if(this.miningPosClaimed === creep.id)
      {
        return new MoveAction(this.miningPos,0,true);
      }
    }

    if(this.source && this.source.energy === 0)
    {
      return new IdleAction();
    }

    return new HarvestAction(this.sourceId,this.pos);
  }
}

