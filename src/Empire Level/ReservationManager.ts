import { Delegation } from "../lib/Delegation";
import { ResourceReservation } from "../lib/Reservations/ResourceReservations";
import { RepairReservation } from "../lib/Reservations/RepairReservations";
import { BuildReservation } from "../lib/Reservations/BuildReservations";
import { sum } from "lodash";

export class ReservationManager extends Delegation
{
    name: string;
    Id: string;
    ShouldExecute(): boolean {
        return Object.values(Memory.BuildResv).length > 0 || Object.values(Memory.RsrcResv).length > 0 || Object.values(Memory.RepairResv).length > 0;
    }
    Execute(): void {
        //For now, just display them
        ResourceReservation.Cleanup();
        RepairReservation.Cleanup();
        BuildReservation.Cleanup();

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
              let rObj = Game.getObjectById(reserver);
              if(rObj)
              {
                vis.line(rObj.pos,obj.pos,{lineStyle:"dotted",color:reservation.amount > 0 ? "#00FF00" : "#FF0000"});
              }
            }
          }
        }
    }

}
