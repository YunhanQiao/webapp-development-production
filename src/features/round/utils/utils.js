//import { getHoleRange } from "../components/ScoreCard/utils";
import { MILE_IN_FEET, MILE_IN_KM, SECONDS_IN_MINUTE } from "./constants";

export const convertMilesToFeet = miles => miles * MILE_IN_FEET;
export const convertFeetToMiles = feet => {
  if (!feet) {
    return;
  }
  return feet / MILE_IN_FEET;
};

export const convertKmToMiles = km => km / MILE_IN_KM;

export const convertMilesToKm = miles => miles * MILE_IN_KM;

export const convertFeetToKilometers = feet => {
  const kilometers = feet * 0.0003048;
  return kilometers.toFixed(2).toString();
};

export const convertFeetToYards = feet => {
  const yards = feet / 3;
  return Math.floor(yards);
};

export const convertFeetToMeters = feet => {
  const meters = feet * 0.3048;
  return Math.floor(meters);
};

export const paceCalculator = (pace, distanceUnit = "km") => {
  if (!pace) return pace;
  const paceMinutes = Math.floor(pace);
  const paceSeconds = Math.round((pace - paceMinutes) * 60);
  const unitLabel = distanceUnit === "km" ? "min/km" : "min/mile";
  return `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")} ${unitLabel}`;
};

export const computeTimePar = timeToPar => {
  if (timeToPar == null) return "(ND)";
  if (timeToPar === 0) return "(E)";

  const absTime = Math.abs(timeToPar);
  const minutes = parseInt(absTime / 60);
  const seconds = parseInt(absTime % 60);
  return `(${timeToPar < 0 ? "-" : "+"}${minutes}:${seconds.toString().padStart(2, "0")})`;
};

export const computeSGSToPar = (timeToPar, strokesToPar) => {
  if (!timeToPar) return "(ND)";

  // const absTime = Math.abs(timeToPar);
  // const minutes = parseInt(absTime / 60);
  // const seconds = parseInt(absTime % 60);
  // return `(${strokesToPar + minutes < 0 ? "" : "+"}${strokesToPar + minutes}:${seconds.toString().padStart(2, "0")})`;
  const sgsToParInSeconds = strokesToPar * 60 + timeToPar;
  const absTime = Math.abs(sgsToParInSeconds);
  const minutes = Math.floor(absTime / 60);
  const seconds = absTime % 60;
  const sign = sgsToParInSeconds < 0 ? "-" : "+";
  return `(${sign}${minutes}:${seconds.toString().padStart(2, "0")})`;
};

export const isSGSToParNegative = (timeToPar, strokesToPar) => {
  if (!timeToPar || !strokesToPar) return null;
  const absTime = Math.abs(timeToPar);
  const minutes = parseInt(absTime / 60);
  const seconds = parseInt(absTime % 60);
  return strokesToPar + minutes < 0 ? true : false;
};

export const distanceCalculator = (distance, distanceUnit) => {
  let output = null;
  if (typeof distance === "number" && !isNaN(distance)) {
    if (distanceUnit === "km") {
      output = convertFeetToKilometers(distance);
    } else if (distanceUnit) {
      output = convertFeetToMiles(distance);
    }
    // kilometer function is already returning 2 decimal places
    if (typeof distance === "number" && !isNaN(distance) && distance != 0) {
      // console.log('output', output)
      if (distanceUnit !== "km") output = output.toFixed(2);
    } else {
      output = "Null";
    }
  } else {
    output = "Null";
  }
  // console.log('output', output, distanceUnit, convertFeetToMiles(distance))
  return output;
};

export function computeFullyMappedTees(selectedCourse) {
  if (!selectedCourse) return [];

  const fullyMappedTeeNames = selectedCourse.mappedTeesCount;

  if (!fullyMappedTeeNames) return [];

  return Object.values(selectedCourse.tees).filter(tee => {
    return fullyMappedTeeNames.includes(tee.name);
  });
}

export const computeStrokesToPar = strokesToPar => {
  if (strokesToPar == null) return "(ND)";
  else if (strokesToPar == 0) return "(E)";
  else if (strokesToPar > 0) return `(+${strokesToPar})`;
  else if (strokesToPar < 0) return `(${strokesToPar})`;
};

export const createDefaultScorecard = () => {
  return Array(18).fill({
    strokes: null,
    strokesToPar: 0,
    timeToPar: 0,
    startTime: null,
    finishTime: null,
    putts: null,
    shotInfo: [],
    minutes: null,
    seconds: null,
    elapsedTime: null,
  });
};

// Define the getHoleRange function here instead of importing it

export const getHoleRange = holeType => {
  switch (holeType) {
    case "Front-9":
      return [0, 9, "Out"];
    case "Back-9":
      return [9, 18, "In"];
    default:
      return [0, 18, "Total"];
  }
};
// const getHoleRange = holeType => {
//   switch (holeType) {
//     case "Front":
//     case "Out":
//       return [0, 9, "Out"];
//     case "Back":
//     case "In":
//       return [9, 18, "In"];
//     case "All":
//       return [0, 18, "All"];
//     default:
//       return [0, 9, "Out"];
//   }
// };

export const prepareHoleData = (holeByHole, userGender, holeType) => {
  const result = [];

  if (!holeByHole) return result;
  const [startIndex, endIndex, selectionType] = getHoleRange(holeType);

  const getHoleTime = (minutes, seconds) => {
    // ? Should zero be treated differently than null? for the 1st condition. If so, use the commented out if condition
    // if ((Number.isNaN(minutes) && Number.isNaN(seconds)) || (minutes == null && seconds == null)) return null;
    const secondsValid = Number.isFinite(seconds);
    const minutesValid = Number.isFinite(minutes);
    if (!minutesValid && !secondsValid) return null;
    if (!minutesValid && secondsValid) return seconds;
    if (!secondsValid && minutesValid) return minutes * SECONDS_IN_MINUTE;
    return minutes * SECONDS_IN_MINUTE + seconds;
    // if (!minutes && !seconds) return null;
    // if (!minutes) return seconds;
    // if (!seconds) return minutes * SECONDS_IN_MINUTE;
    // return minutes * SECONDS_IN_MINUTE + seconds;
  };

  for (let hole of holeByHole) {
    // const holeTime = hole.minutes * SECONDS_IN_MINUTE + hole.seconds;
    const holeTime = getHoleTime(hole.minutes, hole.seconds);
    const index = hole.number - 1;
    let activeRow = false;
    if (index >= startIndex && index < endIndex) {
      result.push({
        strokes: hole.strokes,
        strokesToPar: hole.strokes - hole[`${userGender}StrokePar`],
        startTime: hole.startTime || null,
        endTime: hole.endTime || null,
        finishTime: hole.finishTime || null,
        timeToPar: holeTime ? holeTime - hole[`${userGender}TimePar`] : 0,
        elapsedTime: holeTime,
      });
    } else {
      result.push({
        strokes: null,
        startTime: null,
        finishTime: null,
        endTime: null,
      });
    }

    // const buffer = {
    //   strokes: hole.strokes,
    // strokesToPar: hole.strokes - hole[`${userGender}StrokePar`],
    // startTime: hole.startTime || null,
    // endTime: hole.endTime || null,
    // finishTime: hole.finishTime || null,
    // timeToPar: holeTime ? holeTime - hole[`${userGender}TimePar`] : 0,
    // elapsedTime: holeTime,
    // };
    // if (activeRow) {
    //   buffer.strokesToPar = hole.strokes - hole[`${userGender}StrokePar`];
    //   buffer.timeToPar = holeTime ? holeTime - hole[`${userGender}TimePar`] : 0;
    //   buffer.elapsedTime = holeTime;
    //   buffer.startTime = hole.startTime || null;
    //   buffer.endTime = hole.endTime || null;
    //   buffer.finishTime = hole.finishTime || null;
    // }
    // result.push(buffer)
  }

  return result;
};

export const getSecondsFormatHandler = (set, name) => event => {
  let currentValue = event.target.value;

  if (currentValue.length === 1) {
    currentValue = "0" + currentValue;
  }

  if (currentValue.length > 2) {
    currentValue = currentValue.slice(-2);
  }

  if (currentValue == "00") {
    // currentValue = null;
  }
  if (parseInt(currentValue) > 59) {
    currentValue = "59";
  }
  set(name, currentValue);
};
