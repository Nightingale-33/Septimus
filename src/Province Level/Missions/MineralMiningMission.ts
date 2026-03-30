import { Action } from "lib/Action";
import { BuildAction } from "lib/Actions/Creep/Action.Build";
import { FillAction } from "lib/Actions/Creep/Action.Fill";
import { HarvestAction } from "lib/Actions/Creep/Action.Harvest";
import { IdleAction } from "lib/Actions/Creep/Action.Idle";
import { MoveAction } from "lib/Actions/Creep/Action.Move";
import { RepairAction } from "lib/Actions/Creep/Action.Repair";
import { ProvinceMission, ProvinceMissionMemory } from "lib/Mission/ProvinceMission";
import { AbstractCreep } from "lib/Planning/AbstractCreep";
import { Behaviour, Planner } from "lib/Planning/Planner";
import { RepairReservation } from "lib/Reservations/RepairReservations";
import { ResourceReservation } from "lib/Reservations/ResourceReservations";
import { EXTRACTOR } from "lib/Roles/Role.Extractor";
import { HARVESTER } from "lib/Roles/Role.Harvester";
import { defaultsDeep } from "lodash";
import { Province } from "Province Level/Province";
import { log } from "utils/Logging/Logger";
import { CostMatrixAdjuster } from "utils/MovementUtils";

interface MineralMiningSiteMemory extends ProvinceMissionMemory {
}

const defaultMiningSiteMemory: MineralMiningSiteMemory = {
  Id: ""
};

export class MineralMiningMission extends ProvinceMission implements Behaviour, CostMatrixAdjuster {
    memory: MineralMiningSiteMemory;

    priority: number = 1000;

    mineralId: Id<Mineral>;

    get mineral(): Mineral | null {
        return Game.getObjectById(this.mineralId);
    }

    get visibility(): boolean {
        return this.mineral !== null;
    }

    Planner: Planner;

    constructor(flag: Flag, province: Province) {
        let mineralId = flag.name.split("_", 2)[1] as Id<Mineral>;
        super(flag, province, `${province.name}_${mineralId}`);
        this.mineralId = mineralId;
        this.pos = flag.pos;
        this.Planner = new Planner(this, 5);
        defaultsDeep(this.memory, defaultMiningSiteMemory);
        this.resolveContainer();
        this.miningPos = this.resolveMiningPos();
    }

    static GetFlagColours(): { primary: ColorConstant, secondary: ColorConstant } {
        return { primary: COLOR_GREY, secondary: COLOR_BLUE };
    }

    adjustCostMatrix(roomName: string, cm: CostMatrix): CostMatrix {
        if (this.miningPos.roomName === roomName) {
            cm.set(this.miningPos.x, this.miningPos.y, 50);
        }
        return cm;
    }

    containerId: Id<StructureContainer> | Id<ConstructionSite> | undefined;

    get container(): StructureContainer | ConstructionSite | null | undefined {
        if (!this.containerId) {
        return undefined;
        } else {
        return Game.getObjectById(this.containerId);
        }
    }

    extractorId : Id<StructureExtractor> | Id<ConstructionSite> | undefined;

    get extractor() : StructureExtractor | ConstructionSite | null | undefined {
        if(!this.extractorId)
        {
            return undefined;
        } else {
            return Game.getObjectById(this.extractorId);
        }
    }

    private resolveExtractor() {
        if(this.extractor) {
            return;
        }

        if(!this.visibility) {
            return;
        }

        let extractor = this.pos.findInRange(FIND_STRUCTURES,0).filter((s) : s is StructureExtractor => s.structureType === STRUCTURE_EXTRACTOR);
        if(extractor.length > 0)
        {
            this.extractorId = extractor[0].id;
            return;
        }

        let extractorConstruction = this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES,0).filter((cs) => cs.structureType === STRUCTURE_EXTRACTOR);
        if(extractorConstruction.length > 0)
        {
            this.extractorId = extractorConstruction[0].id;
            return;
        }
        this.extractorId = undefined;
    }

    private resolveContainer() {
        if (this.container) {
        return;
        }

        if (!this.visibility) {
        return;
        }

        let containers = this.pos.findInRange(FIND_STRUCTURES, 1).filter((s): s is StructureContainer => s.structureType === STRUCTURE_CONTAINER);
        if (containers.length > 0) {
        this.containerId = containers[0].id;
        return;
        }
        let containerConstruction = this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1).filter((cs) => cs.structureType === STRUCTURE_CONTAINER);
        if (containerConstruction.length > 0) {
        this.containerId = containerConstruction[0].id;
        return;
        }
        this.containerId = undefined;
    }

    miningPos: RoomPosition;

    private resolveMiningPos(): RoomPosition {
        if (this.container) {
            if (!this.province.Roads.Requests.find((p) => p.isEqualTo(this.container!.pos))) {
            this.province.Roads.Requests.push(this.container.pos);
            }
            return this.container.pos;
        }

        let originPos = this.province.storage ? this.province.storage.pos : this.province.spawns[0].pos;
        let path = PathFinder.search(originPos, { pos: this.pos, range: 1 }, { swampCost: 1, plainCost: 1 });
        return path.path[path.path.length - 1];
    }

    run(): void {
        let readyToMine = true;

        if (this.visibility && !this.container) {
            this.resolveContainer();
            if (this.container === undefined) {
                this.miningPos.createConstructionSite(STRUCTURE_CONTAINER);
            }
        }

        if(this.visibility && !this.extractor) {
            this.resolveExtractor();
            if(this.extractor === undefined)
            {
                this.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
            }
        }

        if(!this.container || this.container instanceof ConstructionSite || !this.extractor || this.extractor instanceof ConstructionSite)
        {
            log(2,`Mission ${this.flag.name} is waiting for the container and extractor to be built`);
            return;
        }

        if(this.mineral && (this.mineral.ticksToRegeneration ?? 0) > 50)
        {
            log(2,`Mission ${this.flag.name} is waiting for the mineral to be available`);
            return;
        }


        let creeps = this.province.RequestCreeps(EXTRACTOR, 1, this.memory.Id, this.priority, {
          maxCreeps: 1,
          deRegisterExcess: false,
          stealCreeps: false,
        });

        if (creeps.length === 0) {
          return;
        }

        for (const creep of creeps) {
          this.Planner.Plan(creep);
        }
    }

    Interrupt(creep: AbstractCreep, afterFirst: AbstractCreep | undefined, nextAction: Action | undefined): Action | null {
        let onMiningPos = creep.pos.isEqualTo(this.miningPos);
        if (!onMiningPos) {
          return new MoveAction(this.miningPos, 0, true);
        }
        return null;
      }

      PlanNext(creep: AbstractCreep): Action | null {
        if (!creep.pos.isEqualTo(this.miningPos)) {
          return new MoveAction(this.miningPos, 0, true);
        }

        if(!this.container || this.container instanceof ConstructionSite)
        {
            log(2,`Harvester: ${creep.name} is waiting for the container to be built`);
            return new IdleAction();
        }

        return new HarvestAction(this.mineralId, this.pos);
      }
}
