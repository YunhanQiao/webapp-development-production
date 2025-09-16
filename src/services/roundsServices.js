import { distanceCalculator } from "features/round/utils";

export const newRoundValidator = newRoundData => {
  const validatorResults = {
    dateValid: true,
    courseValid: true,
    strokesValid: true,
    minutesValid: true,
    secondsValid: true,
    notesValid: true,
    allValid: true,
  };

  //console.log(newRoundData);
  // date validator
  if (newRoundData.date.length === 0) {
    validatorResults.dateValid = false;
    validatorResults.allValid = false;
  }

  /*if (
    newRoundData.course.trim().length === 0 ||
    parseInt(newRoundData.course.trim()) >= 50
  ) {
    validatorResults.courseValid = false;
    validatorResults.allValid = false;
  }*/

  if (!newRoundData.validCourse) {
    validatorResults.courseValid = false;
    validatorResults.allValid = false;
  }

  if (parseInt(newRoundData.strokes) < 9 || parseInt(newRoundData.strokes) > 200) {
    validatorResults.strokesValid = false;
    validatorResults.allValid = false;
  }

  if (parseInt(newRoundData.minutes) < 10 || parseInt(newRoundData.minutes) > 400) {
    validatorResults.minutesValid = false;
    validatorResults.allValid = false;
  }

  if (parseInt(newRoundData.seconds) < 0 || parseInt(newRoundData.seconds) > 59) {
    validatorResults.seconds = false;
    validatorResults.allValid = false;
  }

  if (newRoundData.notes.trim().length >= 500) {
    validatorResults.notesValid = false;
    validatorResults.allValid = false;
  }

  return validatorResults;
};

// Sorting for  rounds column date, course and score
export const sortRounds = (rounds, columnName, direction) => {
  return [...rounds].sort((a, b) => {
    let aValue = a[columnName];
    let bValue = b[columnName];

    // Date sort
    if (columnName === "date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // SGS (Score) sort
    if (columnName === "SGS") {
      // Since we dont have SGS directly in rounds dashboard. We need to compute it using minutes, seconds and strokes
      // const aStrokes = parseInt(a["strokes"]);
      // const aTime = parseInt(a["time"])
      // const bStrokes = parseInt(b["strokes"]);
      // const bTime = parseInt(b["time"])

      // aValue = aStrokes + aTime;
      // bValue = bStrokes + bTime;
      aValue = parseFloat(aValue.split(":")[0]);
      bValue = parseFloat(bValue.split(":")[0]);
    }
    if (columnName === "course") {
      aValue = a.courseId.shortName;
      bValue = b.courseId.shortName;
    }

    if (aValue < bValue) {
      return direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === "ascending" ? 1 : -1;
    }
    return 0;
  });
};

export const searchRounds = (rounds, searchTerm, distanceUnit) => {
  const uppercasedSearchTerm = searchTerm.toUpperCase();
  return rounds.filter(round => {
    const minutes = Math.floor(round.time / 60);
    const seconds = round.time % 60;
    const distance = distanceCalculator(round.distance, distanceUnit);
    // round.SGS is computed on the front-end, hence removing it from rowData
    const rowData =
      `${round.date}${round.courseId.name}${round.strokes}-${round.SGS}-${round.pace}-${round.distance}-${minutes}-${seconds}-${distance}-${round.teesetName ? round.teesetName : ""}`.toUpperCase();
    return rowData.includes(uppercasedSearchTerm);
  });
};

export const convertFeetInchesToKilometers = (feet, inches) => {
  const feetPerInch = 1 / 12; // There are 12 inches in a foot
  const metersPerFoot = 0.3048; // One foot is 0.3048 meters
  const kilometersPerMeter = 1 / 1000; // There are 1000 meters in a kilometer

  // Convert feet and inches to kilometers
  const totalFeet = feet + inches * feetPerInch;
  const meters = totalFeet * metersPerFoot;
  const kilometers = meters * kilometersPerMeter;

  // Return the kilometers value formatted to two decimal places
  return kilometers.toFixed(2);
};

export const convertKilometersToFeetInches = kilometers => {
  //kilometers accept decimal points like (5.21, 4.56)
  const metersPerKilometer = 1000; // One kilometer is 1000 meters
  const feetPerMeter = 3.28084; // One meter is approximately 3.28084 feet
  const inchesPerFoot = 12; // One foot is 12 inches

  // Convert kilometers to feet
  const totalFeet = kilometers * metersPerKilometer * feetPerMeter;
  const feet = Math.floor(totalFeet); // Get whole feet
  const inches = Math.round((totalFeet - feet) * inchesPerFoot); // Convert remaining feet to inches

  // Return the result as an object, or you can format it as a string based on your requirement
  return { feet, inches };
};

export const convertFeetInchesToMiles = (feet, inches) => {
  const feetPerInch = 1 / 12; // 12 inches in a foot
  const feetPerMile = 5280; // 5280 feet in a mile

  // Convert the entire distance to feet
  const totalFeet = feet + inches * feetPerInch;

  // Convert feet to miles
  const miles = totalFeet / feetPerMile;

  // Return miles, formatted to a suitable number of decimal places if necessary
  return miles;
};

export const convertMilesToFeetInches = miles => {
  const feetPerMile = 5280; // 5280 feet in a mile
  const inchesPerFoot = 12; // 12 inches in a foot

  // Convert miles to total feet
  const totalFeet = miles * feetPerMile;

  // Separate whole feet
  const feet = Math.floor(totalFeet);

  // Convert the fractional part of the feet to inches
  const inches = Math.round((totalFeet - feet) * inchesPerFoot);

  // Return the result as an object with feet and inches
  return { feet, inches };
};
