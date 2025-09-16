import * as yup from 'yup';

export const objectIdSchema = yup.string()
.matches(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
.required('ObjectId is required');