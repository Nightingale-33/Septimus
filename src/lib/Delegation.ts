export abstract class Delegation {
  abstract ShouldExecute() : boolean;

  abstract Execute(): void;
}
