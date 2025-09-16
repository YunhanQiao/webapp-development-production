import * as yup from 'yup';

import { objectIdSchema } from '../shared/objectIdSchema';

export const feedReactionSchema = yup.object().shape({
  reactorId: objectIdSchema.required(),
  reactorName: yup.string().required(),
  reactionDate: yup.date().default(() => new Date()),
});

export const feedCommentSchema = yup.object().shape({
  author: objectIdSchema.required(),
  authorName: yup.string().required(),
  datePosted: yup.date().default(() => new Date()),
  textContent: yup.string().required(),
});

export const feedItemSchema = yup.object().shape({
  author: objectIdSchema.required(),
  datePosted: yup.date().default(() => new Date()),
  textContent: yup.string().nullable(),
  media: yup.array().of(yup.string()),
  round: objectIdSchema.nullable(),
  reactions: yup.object().shape({
    like: yup.array().of(feedReactionSchema),
    love: yup.array().of(feedReactionSchema),
    yay: yup.array().of(feedReactionSchema),
    wow: yup.array().of(feedReactionSchema),
    ouch: yup.array().of(feedReactionSchema),
  }),
  comments: yup.array().of(feedCommentSchema),
});