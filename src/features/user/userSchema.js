import * as yup from 'yup';
import { objectIdSchema } from '../shared/objectIdSchema';

const validCountryCodes = ['AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'];
const dataUrlRegex = /^data:image\/([a-zA-Z]*);base64,([^\"]*)$/;

export const userSchema = yup.object().shape({
  accountInfo: yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required(),
  }),
  personalInfo: yup.object().shape({
    lastName: yup.string().required(),
    firstName: yup.string().required(),
    parGender: yup.string().oneOf(['womens', 'mens']).required,
    hometown: yup.string().required(),
    homeState: yup.string().required(),
    homeCountry: yup.string().required().oneOf(validCountryCodes),
    stripeAccountId: yup.string().nullable().default(null),
    stripeAccountStatus: yup
      .string()
      .oneOf(['pending', 'active', 'inactive', 'rejected'])
      .nullable()
      .default('pending'),
    stripeAccountOnboardingComplete: yup.boolean().default(false),
    profilePic: yup.string()
      .required()
      .test('is-data-url', 'Profile picture must be a valid data URL', value => dataUrlRegex.test(value)),
  }),
  speedgolfInfo: yup.object().shape({
    bio: yup.string(),
    homeCourse: yup.string(),
    firstRound: yup.date(),
    clubs: yup.array().of(yup.string().oneOf(['1W','3W','4W','5W','7W', 'HY', '2I','3I','4I',
           '5I','6I','7I','8I','9I','PW','SW','GW','LW','P'])),
    clubNotes: yup.string(),
  }),
  preferences: yup.object().shape({
    parGenderIsPrivate: yup.boolean().default(false),
    homeLocationIsPrivate: yup.boolean().default(false),
    birthdateIsPrivate: yup.boolean().default(false),
    speedgolfInfoIsPrivate: yup.boolean().default(false),
    speedgolfRoundsArePublic: yup.boolean().default(false),
    speedgolfStatsArePublic: yup.boolean().default(false),
    feedPostsArePublic: yup.boolean().default(false),
    preferredUnits: yup.string().oneOf(['imperial', 'metric']).default('imperial'),
  }),
  buddies: yup.array().of(objectIdSchema),
  incomingBuddyRequests: yup.array().of(objectIdSchema),
  outgoingBuddyRequests: yup.array().of(objectIdSchema),
  rounds: yup.array().of(objectIdSchema),
  feedItems: yup.array().of(objectIdSchema),
});