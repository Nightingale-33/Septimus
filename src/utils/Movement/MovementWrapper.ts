import { Profile } from "../Profiler/SimpleProfile";
import { reconcileTraffic, preTick } from "screeps-cartographer"

export function CartographerWrapLoop(loop: () => void)
{
  return () => {
    Profile("Movement Pre-Tick: ", () => preTick());
    loop();
    Profile("Traffic Reconcile", () => reconcileTraffic({visualize: false}));
  };
}
