import { Delegation } from "../lib/Delegation";
import { ResourceReservation } from "../lib/Reservations/ResourceReservations";
import { RepairReservation } from "../lib/Reservations/RepairReservations";
import { BuildReservation } from "../lib/Reservations/BuildReservations";
import { sum } from "lodash";
import { log } from "../utils/Logging/Logger";

declare global
{
  interface Memory {
    displayReservations : boolean;
  }
}

export class ReservationManager extends Delegation
{
    name: string;
    Id: string;
    ShouldExecute(): boolean {
      try {
        return Object.values(Memory.BuildResv).length > 0 || Object.values(Memory.RsrcResv).length > 0 || Object.values(Memory.RepairResv).length > 0;
      } catch (error) {
        log(0,`Error with ShouldExecute: ${error}`);
        return false;
      }

    }
    Execute(): void {
        //For now, just display them
        ResourceReservation.Cleanup();
        RepairReservation.Cleanup();
        BuildReservation.Cleanup();

        if(!Memory.displayReservations)
        {
          return;
        }

        for(const struct in Memory.RsrcResv)
        {
          let id = struct as Id<any>;
          let obj= Game.getObjectById(id);
          if(obj && Memory.RsrcResv[id].length > 0)
          {
            let input = sum(Memory.RsrcResv[id].filter((r) => r.amount > 0).map((r) => r.amount));
            let output = sum(Memory.RsrcResv[id].filter((r) => r.amount < 0).map((r) => r.amount));
            let vis : RoomVisual = obj.room.visual;
            vis.circle(obj.pos,{radius:0.5});
            vis.text(`+${input}`,obj.pos.x,obj.pos.y - 0.25, {color:"#00FF00"});
            vis.text(`-${output}`,obj.pos.x,obj.pos.y + 0.25, {color:"#FF0000"});

            for(const reservation of Memory.RsrcResv[id])
            {
              let reserver = reservation.reserver;
              let rObj = Game.getObjectById(reserver) as (Creep | null);
              if(rObj && rObj.pos.roomName === obj.pos.roomName)
              {
                vis.line(rObj.pos,obj.pos,{lineStyle:"dotted",color:reservation.amount > 0 ? "#00FF00" : "#FF0000"});
              }
            }
          }
        }

        for(const struct in Memory.BuildResv)
        {
          let id = struct as Id<ConstructionSite>;
          let obj= Game.getObjectById(id);
          if(obj && Memory.BuildResv[id].length > 0)
          {
            let input = sum(Memory.BuildResv[id].map((r) => r.amount));
            let vis = obj.room?.visual;
            if(vis)
            {
              vis.circle(obj.pos,{radius:0.5});
              vis.text(`${input}`,obj.pos.x,obj.pos.y - 0.25, {color:"#00A977"});

              for(const reservation of Memory.BuildResv[id])
              {
                let reserver = reservation.reserver;
                let rObj = Game.getObjectById(reserver);
                if(rObj && rObj.pos.roomName === obj.pos.roomName)
                {
                  vis.line(rObj.pos,obj.pos,{lineStyle:"dotted",color:"#00A977"});
                }
              }
            }
          }
        }

      for(const struct in Memory.RepairResv)
      {
        let id = struct as Id<Structure>;
        let obj= Game.getObjectById(id);
        if(obj && Memory.RepairResv[id].length > 0)
        {
          let input = sum(Memory.RepairResv[id].map((r) => r.amount));
          let vis = obj.room?.visual;
          if(vis)
          {
            vis.circle(obj.pos,{radius:0.5});
            vis.text(`${input}`,obj.pos.x,obj.pos.y - 0.25, {color:"#D54E00"});

            for(const reservation of Memory.RepairResv[id])
            {
              let reserver = reservation.reserver;
              let rObj = Game.getObjectById(reserver);
              if(rObj && rObj.pos.roomName === obj.pos.roomName)
              {
                vis.line(rObj.pos,obj.pos,{lineStyle:"dotted",color:"#D54E00"});
              }
            }
          }
        }
      }
    }

}
