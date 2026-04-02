import { ROOM_BOUNDARY_VALUES } from "../../constants";

declare global {
  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      DisplayDT(roomName : string, enabled: boolean):boolean;
    }
  }
}

export class DistanceTransform {

  data: number[] | undefined;

  visual: string | undefined = undefined;

  getDist(x:number,y:number) : number
  {
    if(!this.data)
    {
      throw new Error("Data has not been calculated");
    }
    return this.data[x+y*50];
  }

  calculate(roomTerrain: RoomTerrain)
  {
    let m = ROOM_BOUNDARY_VALUES.maxX + 1;
    let n = ROOM_BOUNDARY_VALUES.maxY + 1;
    let b = DistanceTransform.convertRoomTerrainToArray(roomTerrain, m, n);
    let infinity = m + n;
    let g = new Array(m * n);
    for (let x = 0; x < m; x++) {
      if (b[x + 0 * m]) {
        g[x + 0 * m] = 0;
      } else {
        g[x + 0 * m] = infinity;
      }

      // Scan 1
      for (let y = 1; y < n; y++) {
        if (b[x + y * m]) {
          g[x + y * m] = 0;
        } else {
          g[x + y * m] = 1 + g[x + (y - 1) * m];
        }
      }
      // Scan 2
      for (let y = n - 1; y >= 0; y--) {
        if (g[x + (y + 1) * m] < g[x + y * m]) {
          g[x + y * m] = 1 + g[x + (y + 1) * m];
        }
      }
    }

    //Second Phase
    let dt = new Array(m*n);
    let s = new Array(m);
    let t = new Array(m);
    let q = 0;
    let w;
    for (let y = 0; y < n; y++) {
      q = 0;
      s[0] = 0;
      t[0] = 0;

      // Scan 3
      let u;
      for (u = 1; u < m; u++) {
        while (q >= 0 && DistanceTransform.CDT_f(t[q], s[q], g[s[q] + y * m]) > DistanceTransform.CDT_f(t[q], u, g[u + y * m])) {
          q--;
        }

        if (q < 0) {
          q = 0;
          s[0] = u;
        } else {
          w = 1 + DistanceTransform.CDT_sep(s[q], u, g[s[q] + y * m], g[u + y * m]);
          if (w < m) {
            q++;
            s[q] = u;
            t[q] = w;
          }
        }
      }
      // Scan 4
      for (u = m - 1; u >= 0; u--) {
        dt[u + y * m] = DistanceTransform.CDT_f(u, s[q], g[s[q] + y * m]);
        if (u == t[q]) {
          q--;
        }
      }
    }

    this.data = dt;
  }

  display(roomVisual : RoomVisual) {
    if(!this.data)
    {
      throw new Error("Data has not been calculated");
    }

    if(this.visual)
    {
      roomVisual.import(this.visual);
      return;
    }

    let visual = new RoomVisual();

    let colour = (v: number): string => {
      let proportion = Math.min(1,Math.max (v / 10,0));
      let green = Math.floor((Math.min(proportion, 0.5) * 2) * 255).toString(16).padStart(2, "0");
      return `#00${green}00`;
    };
    let opacity = (v:number): number => {
      return Math.min(0.75,Math.max (v / 10,0));
    }
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        let value = this.data[x + y * 50];
        if(value <= 0)
        {
          continue;
        }
        visual.text(`${value}`, x, y + 0.25, { align: "center", opacity: opacity(value)+0.25, backgroundColor: undefined });
        visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: colour(value), strokeWidth: 0, opacity: opacity(value) });
      }
    }

    this.visual = visual.export();
    roomVisual.import(this.visual);
  }

  private static CDT_f(x: number, i: number, g_i: number) {
    return Math.max(Math.abs(x - i), g_i);
  }

  private static CDT_sep(i: number, u: number, g_i: number, g_u: number) {
    if (g_i <= g_u) {
      return Math.max(i + g_u, Math.floor((i + u) / 2));
    } else {
      return Math.min(u - g_i, Math.floor((i + u) / 2));
    }
  }

  private static convertRoomTerrainToArray(roomTerrain: RoomTerrain, height: number, width: number): number[] {
    const roomMatrix = new Array(width*height);
    for (let y = ROOM_BOUNDARY_VALUES.minY; y <= ROOM_BOUNDARY_VALUES.maxY; ++y) {
      for (let x = ROOM_BOUNDARY_VALUES.minX; x <= ROOM_BOUNDARY_VALUES.maxX; ++x) {
        roomMatrix[x + y * width] = roomTerrain.get(x, y) === TERRAIN_MASK_WALL ? 1 : 0;
        if(y === 0 || y === ROOM_BOUNDARY_VALUES.maxY || x === 0 || x === ROOM_BOUNDARY_VALUES.maxX)
        {
          roomMatrix[x + y * width] = 1;
        }
      }
    }
    return roomMatrix;
  }

}

export const DTDisplayRooms: {[id:string] : boolean} = {};

global.DisplayDT = function(roomName : string, enabled: boolean):boolean {
  DTDisplayRooms[roomName] = enabled;
  return enabled;
}
