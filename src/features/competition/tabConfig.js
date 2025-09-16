import TournamentBasicInfo from "features/competition/pages/newTournament/TournamentBasicInfo";
import TournamentColorTheme from "features/competition/pages/newTournament/TournamentColorTheme";
import TournamentCourses from "features/competition/pages/newTournament/TournamentCourses";
import TournamentDivisions from "features/competition/pages/newTournament/TournamentDivisions";
import TournamentRegPaym from "features/competition/pages/newTournament/TournamentRegPaym";
import TournamentRounds from "features/competition/pages/newTournament/TournamentRounds";
import {
  basicInfoSchema,
  colorTheme,
  coursesSchema,
  divisionsSchema,
  regPaymentInfoSchema,
  roundsSchema,
} from "./tournamentSchema";

const TAB_CONFIG = {
  basicInfo: {
    name: "Basic Info",
    component: TournamentBasicInfo,
    schema: basicInfoSchema,
    defaultValues: {
      startDate: "",
      endDate: "",
      teeTimes: [],
      name: "",
      tournamentShortName: "New Tournament",
      tournamentCreatorName: "",
      tournamentCreatorEmail: "",
      admins: [],
      logo: "",
      rules: "",
      prizeText: "",
      prizeDoc: "",
      additionalInfoText: "",
      additionalInfoDoc: "",
    },
  },
  regPaymentInfo: {
    name: "Registration & Payment",
    component: TournamentRegPaym,
    schema: regPaymentInfoSchema,
    defaultValues: {
      swagSizes: [],
    },
  },
  colorTheme: {
    name: "Color Theme",
    component: TournamentColorTheme,
    schema: colorTheme,
    defaultValues: {
      titleText: "#000000",
      headerRowBg: "#CC2127",
      headerRowTxt: "#ffffff",
      updateBtnBg: "#13294E",
      updateBtnTxt: "#FFFFFF",
      tournNameBannerBg: "#13294E",
      tournNameBannerTxt: "#FFFFFF",
      strParColBg: "#13294E",
      strParColTxt: "#FFFFFF",
      timeParColBg: "#13294E",
      timeParColTxt: "#FFFFFF",
      SGParColBg: "#000000",
      SGParColTxt: "#FFFFFF",
    },
  },
  courses: {
    name: "Courses",
    component: TournamentCourses,
    schema: coursesSchema,
    defaultValues: {
      courseInfo: [],
    },
  },
  // rounds: {
  //   name: "Rounds",
  //   component: TournamentRounds,
  //   schema: roundsSchema,
  //   defaultValues: {
  //     roundsInfo: [
  //       {
  //         date: "",
  //         format: "Speedgolf",
  //       },
  //     ],
  //   },
  // },
  divisions: {
    name: "Divisions",
    component: TournamentDivisions,
    schema: divisionsSchema,
    defaultValues: {
      divisions: [],
    },
  },
};

export const tabConfig = TAB_CONFIG;
