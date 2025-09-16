import * as yup from "yup";
import { objectIdSchema } from "../shared/objectIdSchema";

export const CURRENCY_CODES = [
  "USD",
  "EUR",
  "JPY",
  "GBP",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "SEK",
  "NZD",
  "MXN",
  "SGD",
  "HKD",
  "NOK",
  "KRW",
  "TRY",
  "RUB",
  "INR",
  "BRL",
  "ZAR",
];

export const SWAG_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// export const roundsSchema = yup.object().shape({
//   roundsInfo: yup.array().of(
//     yup.object().shape({
//       date: yup
//         .date()
//         .typeError(({ path }) => {
//           const index = path.match(/\d+/)[0]; // Extract index from path
//           return `Please select a date for round ${parseInt(index) + 1}.`;
//         })
//         .required(),
//       format: yup.string().required(),
//     })
//   ),
// });

export const regPaymentInfoSchema = yup.object().shape({
  regStartDate: yup
    .date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    // .test("is-not-in-past", "Registration start date cannot be in the past.", validateStartDate)
    // .test(
    //   "is-before-tournament-start",
    //   "Registration start date must be before or on tournament start date.",
    //   (value, context) => {
    //     const tournamentStartDate = context.parent?.tournamentStartDate;
    //     return value && new Date(value) <= new Date(tournamentStartDate);
    //   }
    // )
    .required("Please enter a valid registration start date"),

  regEndDate: yup
    .date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .required("Please enter a valid registration end date")
    // .test(
    //   "is-before-tournament-start",
    //   "Registration end date must be before tournament start date.",
    //   (value, context) => {
    //     const tournamentStartDate = context.parent?.tournamentStartDate;
    //     return value && new Date(value) <= new Date(tournamentStartDate);
    //   }
    // )
    .test("is-after-regStartDate", "Registration end date must be after registration start date.", (value, context) => {
      const regStartDate = context.parent?.regStartDate;
      return value && new Date(value) >= new Date(regStartDate);
    }),

  maxAllowedWithdraDate: yup
    .date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .test(
      "is-before-tournament-start",
      "Withdrawal deadline must be before or on tournament start date.",
      (value, context) => {
        const tournamentStartDate = context.parent?.tournamentStartDate;
        return !value || !tournamentStartDate || new Date(value) <= new Date(tournamentStartDate);
      },
    ),
  capReg: yup.boolean().required(),
  capRegAt: yup
    .number()
    .typeError("Please enter a valid cap registration")
    .min(0, "Cap registration must be a valid number"),
  adminApproval: yup.boolean().optional(),
  currencyType: yup.string().oneOf(CURRENCY_CODES, "Must be a valid currency code").required(),
  payThroughApp: yup.boolean().required(),
  processingPercent: yup
    .number()
    .typeError("Please enter a valid percentage of transaction")
    .min(0, "Percentage of Transaction cannot be negative")
    // .required()
    .test("two-decimal", "processingPercent must have two decimal places", value => {
      if (value === undefined || value === null) return true;
      return parseFloat(Number(value.toFixed(2))) === value;
    }),
  processingFee: yup
    .number()
    .typeError("Please enter a valid processing fee")
    .min(0, "Flat Transaction Fee cannot be negative")
    // .required()
    .test("two-decimal", "processingFee must have two decimal places", value => {
      if (value === undefined || value === null) return true;
      return parseFloat(Number(value.toFixed(2))) === value;
    }),
  askSwag: yup.boolean().required(),
  swagName: yup.string().when("askSwag", {
    is: true,
    then: schema => schema.required("Swag Name is required when asking registrant for swag size"),
    otherwise: schema => schema.notRequired(),
  }),

  swagSizes: yup
    .array()
    .of(yup.string().oneOf(SWAG_SIZES, "Must be a valid swag size"))
    .when("askSwag", {
      is: true,
      then: schema =>
        schema.min(1, "Please select at least one swag size").required("Swag size is required when asking for swag."),
      otherwise: schema => schema.notRequired(),
    }),
  totalAmountCollected: yup.number().min(0, "Total amount cannot be negative").default(0),
  payoutStatus: yup.string().oneOf(["pending", "processing", "completed", "failed"]).default("pending"),
  payoutTransactionId: yup.string().nullable(),
  payoutDate: yup.date().nullable(),
  platformFee: yup
    .number()
    .min(0, "Platform fee cannot be negative")
    .default(0)
    .test("two-decimal", "Platform fee must have two decimal places", value => {
      if (value === undefined || value === null) return true;
      return parseFloat(Number(value.toFixed(2))) === value;
    }),
  platformFeeType: yup.string().oneOf(["percentage", "fixed"]).default("percentage"),
});

export const divisionSchema = yup.object().shape({
  name: yup.string().trim().min(1, "Division Name is a required field.").required("Please enter a valid division name"),
  entryFee: yup.number().min(0, "Entry Fee cannot be negative").typeError("Please enter a valid entry fee").required(),
  gender: yup.string().oneOf(["Male", "Female", "All"]).required("Gender is required."),
  minAge: yup
    .number()
    .min(0, "Minimum Age cannot be negative")
    .max(200, "Minimum Age cannot exceed 200")
    .integer("Minimum Age must be a whole number")
    .typeError("Please enter a valid min age")
    .required(),
  maxAge: yup
    .number()
    .min(0, "Maximum Age cannot be negative")
    .max(200, "Maximum Age cannot exceed 200")
    .integer("Maximum Age must be a whole number")
    .typeError("Please enter a valid max age")
    .test({
      message: "Max age must be greater or equal to min age",
      name: "is-greater-than-min-age",
      test: validateMaxAge,
    })
    .required(),
  rounds: yup.array().of(
    yup.object().shape({
      date: yup
        .date()
        .typeError(({ path }) => {
          const index = path.match(/\d+/)[0];
          return `Please select a date for round ${parseInt(index) + 1}.`;
        })
        .required("Date is required"),
      format: yup.string().required("Format is required"),
      numHoles: yup
        .string()
        .oneOf(["18", "Front 9", "Back 9"], "Please select a valid number of holes")
        .required("Please select the number of holes"),
      // courseTee: yup.string().typeError("Please Select Course Tee.").required(),
      courseId: yup
        .string()
        .matches(/^[a-fA-F0-9]{24}$/, "Please select a valid course")
        .required("Please select a course tee"),
      teeId: yup
        .string()
        .matches(/^[a-fA-F0-9]{24}$/, "Please select a valid tee id")
        .required("Tee id mapping error"),
    }),
  ),
});

export const divisionsSchema = yup.object().shape({
  divisions: yup.array().of(divisionSchema),
  // .min(1, "Add at least one division")
  // .required("Division information is required")
  // .test("not-empty", "Please add at least one division", (value) => {
  //   return Array.isArray(value) && value.length > 0;
  // })
  // .default([]),
});

export const basicInfoSchema = yup.object().shape({
  startDate: yup
    .date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .required("Please enter a valid start date.")
    .test("is-not-in-past", "Start date cannot be in the past.", validateStartDate),
  endDateOffset: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .min(0, "Tournament must be at least 1 day long.")
    .required("Tournament duration is required."),
  teeTimes: yup.array().of(
    yup.object().shape({
      date: yup.date().required("Date is required"),
      startTime: yup
        .string()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be a valid time in HH:mm format")
        .required("Start time is required"),
    }),
  ),
  name: yup
    .string()
    .trim()
    .min(1, "Tournament Name is a required field.")
    .max(100, "Tournament Name cannot exceed 100 characters.")
    .required("Tournament Name is a required field."),

  // Use this schema when we have user id for each user
  // tournamentCreator: objectIdSchema.required(),
  // admins: yup
  //   .array()
  //   .of(yup.string().matches(`^[0-9a-fA-F]{24}$`, "Invalid ObjectId format").required("ObjectId is required")),
  admins: yup.array().of(yup.string().matches(`^[0-9a-fA-F]{24}$`, "Invalid ObjectId format").optional()),

  tournamentCreatorName: yup.string().required("Tournament Host is a required field."),
  tournamentCreatorEmail: yup
    .string()
    .email("Please enter a valid email address.")
    .required("Host email is a required field."),

  // Remove these fields once objectIdSchema is implemented
  // tournamentCreatorName: yup.string().required("Tournament Host is a required field."),
  // tournamentCreator: yup.string().typeError("Host email is a required field.").test({
  //   message: 'Host email is not in valid format.',
  //   name: 'valid-email',
  //   test: emailValidator,
  // }).required(),
  // tournamentAdmins: yup.array().of(yup.string()).required(),

  logo: yup
    .string()
    .nullable()
    .test("data-url", "Must be a valid logo.", value => {
      // return /^data:image\/[a-zA-Z]*;base64,/.test(value);
      if (!value) return true;
      const isDataUrl = /^data:image\/[a-zA-Z]*;base64,/.test(value);
      const isS3Url = /https:\/\/[a-zA-Z0-9.-]+\.s3\.us-east-1\.amazonaws\.com\/.+/.test(value);

      return isDataUrl || isS3Url;
    }),

  // Document files
  rules: yup.string().nullable(),
  prizeDoc: yup.string().nullable(),
  additionalInfoDoc: yup.string().nullable(),

  // Text content fields
  prizeText: yup.string().when("prizeDoc", {
    is: val => !val,
    then: schema => schema.optional(),
    otherwise: schema => schema.nullable(),
  }),
  additionalInfoText: yup.string().when("additionalInfoDoc", {
    is: val => !val,
    then: schema => schema.nullable(),
    otherwise: schema => schema.nullable(),
  }),
});

export const coursesSchema = yup.object().shape({
  courseInfo: yup
    .array()
    .min(1, "Please add at least one course")
    .of(
      yup.object().shape({
        courseId: objectIdSchema.typeError("Please enter a valid courseId").required(),
        name: yup.string().nullable(),
        location: yup.string().nullable(),
      }),
    )
    .required("Course information is required")
    .test("not-empty", "Please add at least one course", value => {
      return Array.isArray(value) && value.length > 0;
    })
    .default([]),
});

export const colorTheme = yup.object().shape({
  titleText: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#000000"),
  headerRowBg: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#CC2127"),
  headerRowTxt: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#ffffff"),
  updateBtnBg: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#13294E"),
  updateBtnTxt: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#FFFFFF"),
  tournNameBannerBg: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#13294E"),
  tournNameBannerTxt: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#FFFFFF"),
  strParColBg: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#13294E"),
  strParColTxt: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#FFFFFF"),
  timeParColBg: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#13294E"),
  timeParColTxt: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#FFFFFF"),
  SGParColBg: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#000000"),
  SGParColTxt: yup
    .string()
    .matches(/^#[0-9a-f]{6}$/i, "Must be a valid hex color")
    .default("#FFFFFF"),
});

export const playerRegistrationSchema = yup.object().shape({
  userId: objectIdSchema.required("User ID is required"),
  playerName: yup.string().required("Player Name is a required field."),
  division: yup.string().required("Please select a division"),
  divisionName: yup.string().required("Division Name is a required field."),
  swagSize: yup.string().when(["shouldShowSizes"], {
    is: true,
    then: () => yup.string().oneOf(SWAG_SIZES, "Must be a valid swag size").required("Please select a swag size"),
    otherwise: () => yup.string().nullable(),
  }),
  billingEmail: yup.string().email("Invalid email").required("Email is required"),
  paymentIntentId: yup.string().nullable(),
  avgGolfScore: yup
    .number()
    .typeError("Please enter a valid golf score")
    .min(0, "Score must be 0 or higher")
    .required("Please enter your average golf score"),
  fiveKRunningTime: yup
    .number()
    .typeError("Please enter a valid running time")
    .min(0, "Running Time must be 0 or higher")
    .required("Please enter your 5k running time"),
  shouldShowSizes: yup.boolean(),
});

const tournamentSchema = yup.object().shape({
  basicInfo: basicInfoSchema,
  regPaymentInfoSchema,
  colorTheme: colorTheme,
  courses: coursesSchema.courseInfo,
  // rounds: roundsSchema.roundsInfo,
  divisions: yup.array().of(divisionsSchema),
  players: yup.array().of(
    yup.object().shape({
      _id: objectIdSchema.required(),
      userId: objectIdSchema.required(),
      lastName: yup.string().required(),
      firstName: yup.string().required(),
      hometown: yup.string().required(),
      countryId: yup.string().required(),
      profilePicUrl: yup.string().url().optional(),
      division: yup.string().required("Division is required"),
      swagSize: yup.string().oneOf(SWAG_SIZES, "Must be a valid swag size").nullable().optional(),
      // swagSize: yup.string().required(),
      scoringUrl: yup.string().url().nullable().optional(),
      rounds: yup.array().of(objectIdSchema).optional(),
      avgGolfScore: yup.number().required(),
      fiveKRunningTime: yup.number().required(),
      // scoringUrl: yup.string().url(),
      // rounds: yup.array().of(objectIdSchema),
    }),
  ),
  teeTimes: yup.array().of(
    yup.array().of(
      yup.object().shape({
        time: yup.string().required(),
        player: objectIdSchema.required(),
      }),
    ),
  ),
});

function validateEndDate(endDate, ctx) {
  const { regStartDate } = ctx.parent;
  return regStartDate && endDate && new Date(endDate) >= new Date(regStartDate);
}

function validateMaxAge(maxAge, ctx) {
  const { minAge } = ctx.parent;
  return minAge && maxAge && maxAge >= minAge;
}

function validateBasicInfoEndDate(endDate, ctx) {
  const { startDate } = ctx.parent;
  return startDate && endDate && new Date(endDate) >= new Date(startDate);
}

function validateStartDate(value) {
  const today = new Date().setHours(0, 0, 0, 0);
  return value && new Date(value) >= today;
}

function validateEndDateBI(endDate, context) {
  const { startDate } = context.parent;
  return endDate && startDate && new Date(endDate) >= new Date(startDate);
}

export const publishValidationSchema = yup.object().shape({
  basicInfo: yup.object().shape({
    name: yup.string().required("Tournament name is required"),
    startDate: yup.date().required("Tournament start date is required"),
    endDate: yup.date().required("Tournament end date is required"),
  }),
  regPaymentInfo: yup.object().shape({
    regStartDate: yup.date().required("Registration start date is required"),
    regEndDate: yup.date().required("Registration end date is required"),
  }),
  courses: yup
    .array()
    .min(1, "At least one course is required")
    .of(
      yup.object().shape({
        courseId: yup.string().required("Course ID is required"),
        name: yup.string().required("Course name is required"),
        location: yup.string().required("Course location is required"),
      }),
    ),
  divisions: yup
    .array()
    .min(1, "At least one division is required")
    .of(
      yup.object().shape({
        name: yup.string().required("Division name is required"),
        entryFee: yup.number().required("Entry fee is required"),
        gender: yup.string().required("Gender is required"),
        minAge: yup.number().required("Minimum age is required"),
        maxAge: yup.number().required("Maximum age is required"),
        rounds: yup
          .array()
          .min(1, "At least one round is required for each division")
          .of(
            yup.object().shape({
              date: yup.date().required("Round date is required"),
              courseId: yup.string().required("Course must be selected for each round"),
            }),
          ),
      }),
    ),
});

export const validatePublishTournament = tournament => {
  const errors = [];

  console.log("🔍 Tournament data received for validation:");
  console.log("Tournament object:", tournament);
  console.log("basicInfo.startDate:", tournament?.basicInfo?.startDate);
  console.log("basicInfo.endDate:", tournament?.basicInfo?.endDate);
  console.log("regPaymentInfo.regEndDate:", tournament?.regPaymentInfo?.regEndDate);

  try {
    publishValidationSchema.validateSync(tournament, { abortEarly: false });
  } catch (err) {
    if (err.inner && Array.isArray(err.inner)) {
      errors.push(...err.inner.map(e => e.message));
    }
  }

  if (
    tournament?.basicInfo?.startDate &&
    tournament?.basicInfo?.endDate &&
    tournament?.regPaymentInfo?.regStartDate &&
    tournament?.regPaymentInfo?.regEndDate
  ) {
    // Parse dates as local dates to avoid timezone conversion issues
    const parseLocalDate = dateStr => {
      if (!dateStr) return null;

      // Handle both ISO format (2025-09-14T00:00:00.000Z) and simple format (2025-09-14)
      let dateOnly;
      if (dateStr.includes("T")) {
        // ISO format - extract just the date part
        dateOnly = dateStr.split("T")[0];
      } else {
        // Simple format
        dateOnly = dateStr;
      }

      const [year, month, day] = dateOnly.split("-").map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    };

    const tournamentStartDate = parseLocalDate(tournament.basicInfo.startDate);
    const tournamentEndDate = parseLocalDate(tournament.basicInfo.endDate);
    const regStartDate = parseLocalDate(tournament.regPaymentInfo.regStartDate);
    const regEndDate = parseLocalDate(tournament.regPaymentInfo.regEndDate);

    console.log("🔍 Date validation debug (local dates):");
    console.log("Tournament start date:", tournamentStartDate);
    console.log("Registration end date:", regEndDate);
    console.log("regEndDate > tournamentStartDate:", regEndDate > tournamentStartDate);

    if (regEndDate > tournamentStartDate) {
      errors.push("Registration must end before or on the tournament start date");
    }

    if (tournament.divisions && Array.isArray(tournament.divisions)) {
      tournament.divisions.forEach((division, divIndex) => {
        if (division.rounds && Array.isArray(division.rounds)) {
          division.rounds.forEach((round, roundIndex) => {
            if (round.date) {
              const roundDate = parseLocalDate(round.date);

              if (roundDate < tournamentStartDate || roundDate > tournamentEndDate) {
                errors.push(
                  `Division "${division.name}" Round ${round.roundNumber || roundIndex + 1} (${new Date(
                    round.date,
                  ).toLocaleDateString()}) must be within tournament dates`,
                );
              }
            }
          });
        }
      });
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isDateWithinTournament = (dateStr, tournamentStartDate, tournamentEndDate) => {
  if (!dateStr || !tournamentStartDate || !tournamentEndDate) return false;
  const date = new Date(dateStr);
  const start = new Date(tournamentStartDate);
  const end = new Date(tournamentEndDate);
  return date >= start && date <= end;
};
