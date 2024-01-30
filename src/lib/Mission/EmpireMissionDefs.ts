import { Mission } from "./Mission";

export class EmpireMissionDefs {
  static getMissionFromFlag(flag: Flag) : Mission | null {
    switch (flag.color)
    {
      case COLOR_RED: return this.getRedMission(flag);
      case COLOR_PURPLE: return this.getPurpleMission(flag);
      case COLOR_BLUE: return this.getBlueMission(flag);
      case COLOR_CYAN: return this.getCyanMission(flag);
      case COLOR_GREEN: return this.getGreenMission(flag);
      case COLOR_YELLOW: return this.getYellowMission(flag);
      case COLOR_ORANGE: return this.getOrangeMission(flag);
      case COLOR_BROWN: return this.getBrownMission(flag);
      case COLOR_GREY: return this.getGreyMission(flag);
      case COLOR_WHITE: return this.getWhiteMission(flag);
    }
  }

  private static getRedMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getPurpleMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getBlueMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getCyanMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getGreenMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getYellowMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getOrangeMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getBrownMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getGreyMission(flag: Flag) : Mission | null {
    return null;
  }

  private static getWhiteMission(flag: Flag) : Mission | null {
    return null;
  }
}
