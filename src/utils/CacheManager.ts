import { Delegation } from "../lib/Delegation";

interface CacheItem<T> {
  expiresAt: number;
  value: T;
}

export const Cache_Manager_Name = "Cache";
export class CacheManager implements Delegation {
    ShouldExecute(): boolean {
        return Object.keys(this.CacheItems).length > 0;
    }
    Execute(): void {
      for(const item in this.CacheItems)
      {
        if(this.CacheItems[item].expiresAt <= Game.time)
        {
          delete this.CacheItems[item];
        }
      }
    }
    CacheItems: {[id:string]: CacheItem<any>} = {};

    name: string =Cache_Manager_Name;

    UseValue<T>(generator: () => T,ttl:number, id: string) : T {
      let existingVal = this.GetItem<T>(id);
      if(existingVal)
      {
        return existingVal;
      } else
      {
        let value = generator();
        this.SetItem(id,ttl,value);
        return value;
      }
    }

    SetItem<T>(id: string, ttl: number, value: T) {
      ttl = Math.max(0,ttl);
      this.CacheItems[id] = {expiresAt: Game.time + ttl, value: value};
    }

    GetItem<T>(id: string) : T | null {
      if(this.CacheItems[id])
      {
        return this.CacheItems[id].value as T;
      }
      return null;
    }

    ClearItem<T>(id:string) : void {
      if(this.CacheItems[id])
      {
        delete this.CacheItems[id];
      }
    }
}
