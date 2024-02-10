import { cloneDeep, sum } from "lodash";

export interface SimpleStoreMethods {
  getCapacity(resource?: ResourceConstant | undefined): number;

  getUsedCapacity(resource?: ResourceConstant | undefined): number | null;

  getFreeCapacity(resource?: ResourceConstant | undefined): number | null;
}

export class SimpleStore implements SimpleStoreMethods {
  totalCapacity: number;
  contents: {[id:string]: number};

  constructor(store: StoreDefinition | SimpleStore) {
    this.totalCapacity = store.getCapacity() ?? 0;
    if(store instanceof SimpleStore)
    {
      this.contents = cloneDeep(store.contents);
    } else
    {
      // @ts-ignore
      this.contents = cloneDeep(store);
    }
  }

  getCapacity(resource?: ResourceConstant | undefined): number {
    if(!resource)
    {
      return this.totalCapacity;
    }

    return (this.getUsedCapacity(resource) ?? 0) + (this.getFreeCapacity(resource) ?? 0);
  }

  getUsedCapacity(resource?: ResourceConstant | undefined): number {
    if(!resource)
    {
      return sum(Object.values(this.contents));
    }
    return this.contents[resource] ?? 0;
  }

  getFreeCapacity(resource?: ResourceConstant | undefined): number {
    return this.totalCapacity - (this.getUsedCapacity() ?? 0);
    //Technically should have a more complex thing for body parts used. But meh
  }

  setUsed(resource:ResourceConstant,amount:number)
  {
    this.contents[resource] = amount;
  }
}
