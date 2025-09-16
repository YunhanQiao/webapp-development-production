/************************************************************************
 * File: courseSchema.js
 * Description: This file uses the yup library to define the schema for 
 * a golf course. The schema is used to validate data before it is
 * added to the redux store.
 ***********************************************************************/
 
import * as yup from 'yup';
import { objectIdSchema } from '../shared/objectIdSchema';

export const holeSchema = yup.object().shape({
  number: yup.number(),
  name: yup.string(),
  golfDistance: yup.number(),
  runningDistance: yup.number(),
  womensHandicap: yup.number(),
  mensHandicap: yup.number(),
  womensStrokePar: yup.number(),
  mensStrokePar: yup.number(),
  womensTimePar: yup.number(),
  mensTimePar: yup.number(),
  teeLoc: yup.object().shape({
    lat: yup.number(),
    lng: yup.number(),
    elv: yup.number(),
  }),
  flagLoc: yup.object().shape({
    lat: yup.number(),
    lng: yup.number(),
    elv: yup.number(),
  }),
  features: yup.array().of(
    yup.object().shape({
      type: yup.string().oneOf(['FAIRWAY', 'GREEN', 'BUNKER','WATER','ROUGH']),
      polygon: yup.array().of(
        yup.object().shape({
          lat: yup.number(),
          lng: yup.number(),
        })
      ),
    })
  ),
  golfPath: yup.array().of(
    yup.object().shape({
      lat: yup.number(),
      lng: yup.number(),
      elv: yup.number(),
    })
  ),
  transitionPath: yup.array().of(
    yup.object().shape({
      lat: yup.number(),
      lng: yup.number(),
      elv: yup.number(),
    })
  ),
});

export const teeSetSchema = yup.object().shape({
  golfCourseId: objectIdSchema.required(),
  name: yup.string(),
  finishLinePath: yup.array().of(
    yup.object().shape({
      geoLat: yup.number(),
      geoLong: yup.number(),
      elev: yup.number(),
    })
  ),
  golfDistance: yup.number(),
  runningDistance: yup.number(),
  mensStrokePar: yup.number(),
  womensStrokePar: yup.number(),
  womensTimePar: yup.number(),
  mensTimePar: yup.number(),
  mensSlope: yup.number(),
  mensRating: yup.number(),
  womensSlope: yup.number(),
  womensRating: yup.number(),
  holes: yup.array().of(holeSchema),
});

export const courseSchema = yup.object().shape({
  name: yup.string().required(),
  address: yup.string(),
  state: yup.string(),
  country: yup.string(),
  phoneNumber: yup.string(),
  geoLocation: yup.object().shape({
    lat: yup.number(),
    lng: yup.number(),
  }),
  viewport: yup.object().shape({
    east: yup.number(),
    north: yup.number(),
    south: yup.number(),
    west: yup.number(),
  }),
  sgContactName: yup.string(),
  sgEmail: yup.string(),
  website: yup.string(),
  mapsUrl: yup.string(),
  images: yup.array().of(yup.string()),
  numHoles: yup.number().required().default(18),
  sgFriendlinessRating: yup.array().of(yup.number()),
  sgMembership: yup.array().of(yup.boolean()),
  sgRoundDiscount: yup.array().of(yup.boolean()),
  sgStandingTeeTimes: yup.array().of(yup.boolean()),
  sgAnyTime: yup.array().of(yup.boolean()),
  sgRegularTeeTimesOnly: yup.array().of(yup.boolean()),
  sgSpecialArrangementOnly: yup.array().of(yup.boolean()),
  sgNotes: yup.string(),
  teeSetIds: yup.array().of(objectIdSchema),
  createdAt: yup.date().default(() => new Date()),
  modifiedAt: yup.date().default(() => new Date()),
});