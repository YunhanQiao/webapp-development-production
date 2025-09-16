import { format } from "date-fns";
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from "features/round/utils";
import { getHoleRange } from "../../utils";

export const mergeHoleData = (holes, holeData) => holes.map((hole, idx) => Object.assign({ ...holeData[idx] }, hole));

export function getHoleByHoleData(holes, holeType, gender) {
  const result = {
    holeByHole: holes,
    in: getDefaultState(gender),
    out: getDefaultState(gender),
    total: getDefaultState(gender),
  };

  const [startIndex, endIndex, selectionType] = getHoleRange(holeType);

  for (let i = 0; i < 9; i++) {
    const outData = holes[i];
    const inData = holes[i + 9];

    for (const key in result.total) {
      const inValue = parseInt(inData[key] || 0);
      const outValue = parseInt(outData[key] || 0);

      result.in[key] += inValue;
      result.out[key] += outValue;
      if (selectionType === "Total") {
        result.total[key] += inValue + outValue;
      } else if (selectionType === "Out") {
        result.total[key] += outValue;
      } else {
        result.total[key] += inValue;
      }
    }
  }
  result.in.seconds = result.in.seconds.toString().padStart(2, "0");
  result.out.seconds = result.out.seconds.toString().padStart(2, "0");
  result.total.seconds = result.total.seconds.toString().padStart(2, "0");
  return result;
}

export function getDefaultState(gender = "mens") {
  return {
    runDistance: 0,
    transRunDistance: 0,
    golfRunDistance: 0,
    [`${gender}StrokePar`]: 0,
    [`${gender}TimePar`]: 0,
    strokes: 0,
    minutes: 0,
    seconds: 0,
  };
}

export const sumValues = numbers => numbers.reduce((sum, num) => (Number.isNaN(num) ? sum : sum + num), 0);

export const isAllStrokesNaN = values => {
  return values.every(value => Number.isNaN(value["strokes"]) || value["strokes"] === null);
};

export const isAllTimesNaN = values => {
  return values.every(
    value =>
      (Number.isNaN(value["minutes"]) || value["minutes"] === null) &&
      (Number.isNaN(value["seconds"]) || value["seconds"] === null),
  );
};
/**
 *
 * The function below is commented as the logic is bit invalid. The right logic is written just below this
 */
// export const holeDataAdapterByGender = gender => (holeData, userHoleData) => {
//   const result = [];

//   if (!gender || !userHoleData || userHoleData.length === 0) {
//     return result;
//   }

//   for (let i = 0; i < holeData.length; i++) {
//     const time = holeData[i][`${gender}TimePar`] + userHoleData[i].timeToPar;
//     const minutes = Math.round(time / SECONDS_IN_MINUTE);
//     const seconds = Math.round(time % SECONDS_IN_MINUTE);

//     result.push({
//       strokes: userHoleData[i].strokes,
//       minutes,
//       seconds,
//     });
//   }

//   return result;
// };

/**
 *
 * Need to compute minutes and seconds by elapsed time.
 */
export const holeDataAdapterByGender = gender => (holeData, userHoleData, holeType, holesChanged) => {
  const result = [];

  if (!gender || !userHoleData || userHoleData.length === 0) {
    return result;
  }

  // end index in exclusive, so no need to add + 1
  const [startIndex, endIndex] = getHoleRange(holeType);

  for (let i = 0; i < holeData.length; i++) {
    // const time = holeData[i][`${gender}TimePar`] + userHoleData[i].timeToPar;
    const time = userHoleData[i].elapsedTime;
    let minutes = null,
      seconds = null,
      strokes = null;
    if (i >= startIndex && i < endIndex && time && !holesChanged) {
      // Need to avoid this because of issues related to concatination in elapsed time
      // seconds = Math.round(time % SECONDS_IN_MINUTE)
      //   .toString()
      //   .padStart(2, "0");
      seconds = Math.round(time % SECONDS_IN_MINUTE);
      minutes = Math.round(time / SECONDS_IN_MINUTE);
    }
    if (i >= startIndex && i < endIndex && userHoleData[i].strokes && !holesChanged) {
      strokes = userHoleData[i].strokes;
    }
    result.push({
      strokes,
      minutes,
      seconds,
    });
  }

  return result;
};

// export const getHoleRange = holeType => {
//   switch (holeType) {
//     case "Front-9":
//       return [0, 9, "Out"];
//     case "Back-9":
//       return [9, 18, "In"];
//     default:
//       return [0, 18, "Total"];
//   }
// };

export const generateToParComputationObject = (rowName, holeByHole, parGender, selectionType) => {
  if (rowName === "out" || rowName === "in" || rowName === "total") {
    let startIndex = 0;
    let endIndex = 18;
    if (rowName === "out") {
      startIndex = 0;
      endIndex = 9;
    } else if (rowName === "in") {
      startIndex = 9;
      endIndex = 18;
    }

    if (rowName === "total" && selectionType === "Out") {
      startIndex = 0;
      endIndex = 9;
    } else if (rowName === "total" && selectionType === "In") {
      startIndex = 9;
      endIndex = 18;
    } else if (rowName === "total" && selectionType === "Total") {
      startIndex = 0;
      endIndex = 18;
    }

    const rowValues = holeByHole.slice(startIndex, endIndex).map(item => {
      return {
        strokes: item.strokes,
        minutes: item.minutes,
        seconds: item.seconds,
        strokePar: item[parGender + "StrokePar"],
        timePar: item[parGender + "TimePar"],
      };
    });
    const strokeParSum = sumValues(
      rowValues.map(item => {
        if (Number.isFinite(item.strokes)) {
          return item.strokePar;
        }
        return 0;
      }),
    );
    const strokeSum = sumValues(rowValues.map(item => item.strokes));
    let strokeToPar = null;
    let timeToPar = null;

    const minutesSum = sumValues(rowValues.map(item => item.minutes));
    const secondsSum = sumValues(rowValues.map(item => item.seconds));
    const time = minutesSum * SECONDS_IN_MINUTE + secondsSum;
    const timeParSum = sumValues(
      rowValues.map(item => {
        if (Number.isFinite(item.minutes) || Number.isFinite(item.seconds)) {
          return item.timePar;
        }
        return 0;
      }),
    );

    if (Number.isFinite(strokeSum) && rowValues.some(item => Number.isFinite(item.strokes))) {
      strokeToPar = strokeSum - strokeParSum;
      strokeToPar = strokeToPar > 0 ? `(+${strokeToPar})` : `(${strokeToPar})`;
    }
    let timeToParFormatted = null;
    if (
      Number.isFinite(time) &&
      rowValues.some(item => Number.isFinite(item.minutes) || Number.isFinite(item.seconds))
    ) {
      timeToPar = time - timeParSum;
      const timeToParNegative = timeToPar < 0;
      timeToPar = parseInt(Math.abs(timeToPar));
      const minutes = Math.floor(timeToPar / SECONDS_IN_MINUTE);
      const seconds = timeToPar % SECONDS_IN_MINUTE;
      // timeToParFormatted = format(new Date(timeToPar * MS_IN_SECOND), "mm:ss");
      timeToParFormatted = `${minutes.toString().padStart(1, "0")}:${seconds.toString().padStart(2, "0")}`;
      timeToParFormatted = !timeToParNegative ? `(+${timeToParFormatted})` : `(-${timeToParFormatted})`;
    }
    return { strokeToPar, timeToPar: timeToParFormatted };
  }
  return { strokeToPar: null, timeToPar: null };
};
