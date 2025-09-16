import * as yup from "yup";

const strokesSchema = yup
  .number()
  .transform(val => (Number.isNaN(val) ? null : val))
  .nullable()
  .required("Strokes is required field")
  .integer("Strokes cannot be a decimal value")
  .min(0, "Strokes cannot be negative");

// export const scoreCardSchema = yup.object().shape({
//   holeByHole: yup.array().when("showHoleTimes", {
//     is: true,
//     then: schema =>
//       schema.of(
//         yup.object().shape({
//           strokes: strokesSchema,
//           minutes: yup
//             .number()
//             .transform(val => (Number.isNaN(val) ? 0 : val))
//             .nullable()
//             .integer("Minutes cannot be a decimal value")
//             .min(0, "Minutes cannot be negative")
//             .max(99),
//           seconds: yup
//             .number()
//             .transform(val => (Number.isNaN(val) ? 0 : val))
//             .nullable()
//             .min(0, "Seconds cannot be negative")
//             .integer("Seconds cannot be a decimal value")
//             .max(59, "One or More Seconds value is greater than 59"),
//         }),
//       ),
//     otherwise: schema =>
//       schema.of(
//         yup.object().shape({
//           strokes: strokesSchema,
//         }),
//       ),
//   }),
// });

// Function to create the schema dynamically
export const getScoreCardSchema = (startIndex, endIndex) => {
  return yup.object().shape({
    showHoleTimes: yup.boolean().required(), // Ensure showHoleTimes is available

    holeByHole: yup.array().when("showHoleTimes", {
      is: true, // Only apply validation if showHoleTimes is true
      then: schema =>
        schema.of(
          yup.lazy(item => {
            // Apply validation to indices within the range
            const index = item.number - 1;
            if (index >= startIndex && index < endIndex) {
              return yup.object().shape({
                strokes: strokesSchema,
                minutes: yup
                  .number()
                  .transform(val => (Number.isNaN(val) ? 0 : val))
                  .nullable()
                  .integer("Minutes cannot be a decimal value")
                  .min(0, "Minutes cannot be negative")
                  .max(99, "Minutes cannot exceed 99"),
                seconds: yup
                  .number()
                  .transform(val => (Number.isNaN(val) ? 0 : val))
                  .nullable()
                  .integer("Seconds cannot be a decimal value")
                  .min(0, "Seconds cannot be negative")
                  .max(59, "Seconds cannot exceed 59"),
              });
            }
            // Ensure null values for indices outside the range
            return yup.object().shape({
              strokes: yup
                .mixed()
                .nullable()
                .test(
                  "is-null",
                  "Strokes must remain null outside the range",
                  value => value === null || Number.isNaN(value),
                ),
              minutes: yup
                .mixed()
                .nullable()
                .test(
                  "is-null",
                  "Minutes must remain null outside the range",
                  value => value === null || Number.isNaN(value),
                ),
              seconds: yup
                .mixed()
                .nullable()
                .test(
                  "is-null",
                  "Seconds must remain null outside the range",
                  value => value === null || Number.isNaN(value),
                ),
            });
          }),
        ),

      // otherwise: schema => {
      //   console.log('Inside otherwise')
      //   return schema.of(
      //     yup.object().shape({
      //       strokes: strokesSchema,
      //     }),
      //   );
      // }
      otherwise: schema =>
        schema.of(
          yup.lazy(item => {
            const index = item.number - 1;
            if (index >= startIndex && index < endIndex) {
              return yup.object().shape({
                strokes: strokesSchema,
              });
            }
            return yup.object().shape({
              strokes: yup
                .mixed()
                .nullable()
                .test(
                  "is-null",
                  "Strokes must remain null outside the range",
                  value => value === null || Number.isNaN(value),
                ),
            });
          }),
        ),
    }),
  });
};
