import * as yup from 'yup';
import { objectIdSchema } from '../shared/objectIdSchema';

export const shotInfoSchema = yup.object().shape({
  bagDownTime: yup.date(),
  geoLoc: yup.object().shape({
    geoLat: yup.number(),
    geoLong: yup.number(),
  }),
  courseLoc: yup.string().oneOf(['TEE', 'FAIRWAY', 'ROUGH', 'BUNKER', 'GREEN', 'PENALTY']),
  heartRate: yup.number(),
  distanceHit: yup.number(),
  distanceToHole: yup.number(),
  distanceRun: yup.number(),
  time: yup.number(),
  clubHit: yup.string().oneOf(['1W','3W','4W','5W','7W', 'HY', '2I','3I','4I','5I','6I','7I','8I','9I','PW','SW','GW','LW','P']),
  bagUpTime: yup.date(),
});

export const roundHoleSchema = yup.object().shape({
  strokes: yup.number(),
  startTime: yup.date(),
  finishTime: yup.date(),
  putts: yup.number(),
  shotInfo: yup.array().of(shotInfoSchema),
});

export const roundSchema = yup.object().shape({
  deleted: yup.boolean().default(false),
  player: objectIdSchema.required(),
  course: objectIdSchema.required(),
  tee: objectIdSchema.required(),
  strokes: yup.number().required().default(80),
  time: yup.number().required().default(3600),
  roundType: yup.string().oneOf(['PRACTICE', 'LEAGUE', 'TOURNAMENT']).default('PRACTICE'),
  sgScore: yup.number(),
  toPar: yup.number(),
  avgHeartRate: yup.number(),
  notes: yup.string(),
  media: yup.array().of(yup.string()),
  holeByHole: yup.array().of(roundHoleSchema),
});