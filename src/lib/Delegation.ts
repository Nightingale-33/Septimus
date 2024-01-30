//Delegations function like processes with conditional execution
export abstract class Delegation {
  abstract name:string;

  abstract ShouldExecute() : boolean;

  abstract Execute(): void;
}
