export class SimpleStore implements StoreDefinition
{
  totalCapacity: number;
  contents: {[id:string] : number} = {};

  constructor(store: StoreDefinition) {
    this.totalCapacity = store.getCapacity();
    for(const type of RESOURCES_ALL)
    {
      this.contents[type] = store.getUsedCapacity(type);
    }
  }

  getCapacity<R extends ResourceConstant | undefined = undefined>(resource?: R | undefined): R extends undefined ? number : R extends ResourceConstant ? number : null {
      throw new Error("")
    }
    getUsedCapacity<R extends ResourceConstant | undefined = undefined>(resource?: R | undefined): R extends undefined ? number : R extends ResourceConstant ? number : null {
        throw new Error("Method not implemented.");
    }
    getFreeCapacity<R extends ResourceConstant | undefined = undefined>(resource?: R | undefined): R extends undefined ? number : R extends ResourceConstant ? number : null {
        throw new Error("Method not implemented.");
    }

  energy: number;
  power: number;
  ops: number;
  U: number;
  L: number;
  K: number;
  Z: number;
  O: number;
  H: number;
  X: number;
  OH: number;
  ZK: number;
  UL: number;
  G: number;
  UH: number;
  UO: number;
  KH: number;
  KO: number;
  LH: number;
  LO: number;
  ZH: number;
  ZO: number;
  GH: number;
  GO: number;
  UH2O: number;
  UHO2: number;
  KH2O: number;
  KHO2: number;
  LH2O: number;
  LHO2: number;
  ZH2O: number;
  ZHO2: number;
  GH2O: number;
  GHO2: number;
  XUH2O: number;
  XUHO2: number;
  XKH2O: number;
  XKHO2: number;
  XLH2O: number;
  XLHO2: number;
  XZH2O: number;
  XZHO2: number;
  XGH2O: number;
  XGHO2: number;
  mist: number;
  biomass: number;
  metal: number;
  silicon: number;
  utrium_bar: number;
  lemergium_bar: number;
  zynthium_bar: number;
  keanium_bar: number;
  ghodium_melt: number;
  oxidant: number;
  reductant: number;
  purifier: number;
  battery: number;
  composite: number;
  crystal: number;
  liquid: number;
  wire: number;
  switch: number;
  transistor: number;
  microchip: number;
  circuit: number;
  device: number;
  cell: number;
  phlegm: number;
  tissue: number;
  muscle: number;
  organoid: number;
  organism: number;
  alloy: number;
  tube: number;
  fixtures: number;
  frame: number;
  hydraulics: number;
  machine: number;
  condensate: number;
  concentrate: number;
  extract: number;
  spirit: number;
  emanation: number;
  essence: number;
}
