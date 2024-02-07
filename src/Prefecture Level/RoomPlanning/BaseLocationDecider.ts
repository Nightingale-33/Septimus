import { Delegation } from "../../lib/Delegation";
import { Prefecture } from "../Prefecture";
import { DistanceTransform } from "./DistanceTransform";
import { max } from "lodash";
import { designDiamond } from "./BaseDesignDiamond";
import { isEnterable } from "../../utils/MovementUtils";
import { Province } from "../../Province Level/Province";
import { GetBuildsFromPlan } from "./ConvertPlanToBunker";

declare global {
  interface RoomMemory
  {
    baseAnchor?: RoomPosition;
  }
}

export class BaseLocationDecider extends Delegation {
  name: string = "BaseLocationDecider";

  get Id(): string {
    return this.prefecture.RoomName + "_" + this.name;
  }

  province: Province;
  prefecture: Prefecture;

  constructor(province: Province, prefecture: Prefecture) {
    super();
    this.province = province;
    this.prefecture = prefecture;
    this.distanceTrans = new DistanceTransform();
  }

  ShouldExecute(): boolean {
    return true;
  }

  distanceTrans : DistanceTransform;

  Execute(): void {
    if(!this.prefecture.memory.baseAnchor)
    {
      //We need to pick one
      if(this.prefecture.distanceTransformer.data)
      {
        let data = this.prefecture.distanceTransformer.data;
        let maxValue = max(data);
        // d = x + 50*y ... d - 50y = x ... (d - x)/50 = y
        let spots = BaseLocationDecider.IndexesOf(data,(d) => d === maxValue)
          .map((d) => this.prefecture.room.getPositionAt(d % 50,Math.floor(d/50)));

        let offset = spots.length;
        let count = 0;
        for(const spot of spots)
        {
          let issues : number = 0;
          if(spot)
          {
            if((Game.time + count) % offset === 0)
            {
              let builds = GetBuildsFromPlan(designDiamond,spot);
              for(const build of builds)
              {
                let pos = build[1];
                let colour :string;
                switch(build[0])
                {
                  case STRUCTURE_STORAGE: colour = "#FF6600"; break;
                  case STRUCTURE_ROAD: colour = "#005500"; break;
                  case STRUCTURE_SPAWN: colour = "#550000"; break;
                  case STRUCTURE_EXTENSION: colour = "#A5A600"; break;
                  case STRUCTURE_TOWER: colour = "#0000FF"; break;
                  default: colour = "#FFFFFF"; break;
                }
                this.prefecture.room.visual.circle(pos,{radius:0.5,fill:colour,strokeWidth:0});
                let buildable = isEnterable(pos);
                if(!buildable)
                {
                  this.prefecture.room.visual.line(pos.x - 0.5, pos.y - 0.5, pos.x + 0.5, pos.y + 0.5, {lineStyle:"solid",color:"#FF0000"});
                  this.prefecture.room.visual.line(pos.x - 0.5, pos.y + 0.5, pos.x + 0.5, pos.y - 0.5, {lineStyle:"solid",color:"#FF0000"});
                  issues++;
                }
              }

              this.prefecture.room.visual.circle(spot,{radius:0.25,fill:"#00FF00",strokeWidth:0});
              if(issues === 0)
              {
                this.prefecture.memory.baseAnchor = spot;
                spot.createFlag(`${this.province.name}_Diamond_Anchor`,COLOR_BROWN,COLOR_BROWN);
                break;
              }
            }
          }
          count++;
        }
      } else
      {
        return;
      }
    }
  }

  private static IndexesOf<T>(data: T[], predicate: (val:T) => boolean) : number[]
  {
    let indexes : number[] = [];
    for(let i = 0; i < data.length; ++i)
    {
      if(predicate(data[i]))
      {
        indexes.push(i);
      }
    }
    return indexes;
  }

}
