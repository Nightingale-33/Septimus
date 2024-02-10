import { Province } from "../../Province Level/Province";
import { MiningMission } from "../../Province Level/Missions/MiningMission";
import { ProvinceMission } from "./ProvinceMission";
import { OwnedControllerMission } from "../../Province Level/Missions/OwnedControllerMission";
import { BaseBuild } from "../../Prefecture Level/RoomPlanning/RoomBuildMission";
import { ReserveControllerMission } from "../../Province Level/Missions/ReserveControllerMission";
import { ClaimControllerMission } from "../../Province Level/Missions/ClaimControllerMission";
import { DefendPrefectureMission } from "../../Province Level/Missions/DefendPrefectureMission";

export class ProvinceMissionDefs {
  static getProvinceMissionFromFlag(flag: Flag, province: Province) : ProvinceMission | null {
    switch (flag.color)
    {
      case COLOR_RED: return this.getRedProvinceMission(flag,province);
      case COLOR_PURPLE: return this.getPurpleProvinceMission(flag,province);
      case COLOR_BLUE: return this.getBlueProvinceMission(flag,province);
      case COLOR_CYAN: return this.getCyanProvinceMission(flag,province);
      case COLOR_GREEN: return this.getGreenProvinceMission(flag,province);
      case COLOR_YELLOW: return this.getYellowProvinceMission(flag,province);
      case COLOR_ORANGE: return this.getOrangeProvinceMission(flag,province);
      case COLOR_BROWN: return this.getBrownProvinceMission(flag,province);
      case COLOR_GREY: return this.getGreyProvinceMission(flag,province);
      case COLOR_WHITE: return this.getWhiteProvinceMission(flag,province);
    }
  }

  private static getRedProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    switch(flag.secondaryColor)
    {
      case COLOR_GREY: return new DefendPrefectureMission(flag,province);
    }
    return null;
  }

  private static getPurpleProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    switch (flag.secondaryColor)
    {
      case COLOR_WHITE: return new OwnedControllerMission(flag,province);
      case COLOR_GREY: return new ReserveControllerMission(flag,province);
      case COLOR_PURPLE: return new ClaimControllerMission(flag,province);
    }
    return null;
  }

  private static getBlueProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    return null;
  }

  private static getCyanProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    return null;
  }

  private static getGreenProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    return null;
  }

  private static getYellowProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    return null;
  }

  private static getOrangeProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    return null;
  }

  private static getBrownProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    switch(flag.secondaryColor)
    {
      case COLOR_BROWN: return new BaseBuild(flag,province);
    }
    return null;
  }

  private static getGreyProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    switch (flag.secondaryColor)
    {
      case COLOR_YELLOW: return new MiningMission(flag,province);
    }
    return null;
  }

  private static getWhiteProvinceMission(flag: Flag, province: Province) : ProvinceMission | null {
    return null;
  }
}
