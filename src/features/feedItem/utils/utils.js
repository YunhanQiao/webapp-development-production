/**
 * Utility functions for pace, unit formatting and date formatting
 */
import { convertFeetToKilometers, convertFeetToMiles } from "../../round/utils/utils";
/**
 * Calculates and rounds pace based on distance and measurement system
 * @param {number|string} distanceInFeet - Distance in feet
 * @param {string} measurementSystem - "metric", "imperial", or other
 * @returns {string} - Formatted pace value with 2 decimal places
 */
export function roundPace(distanceInFeet, measurementSystem) {
  let distance = parseFloat(distanceInFeet);

  if (measurementSystem === "metric") {
    const metricDistance = distance * 0.0003048; // Convert feet to kilometers
    const metricPace = 60 / metricDistance;
    return metricPace.toFixed(2);
  } else if (measurementSystem === "imperial") {
    const imperialDistance = distance / 5280; // Convert feet to miles
    const imperialPace = 60 / imperialDistance;
    return imperialPace.toFixed(2);
  } else {
    return (distance / 60).toFixed(2);
  }
}

/**
 * Returns the appropriate unit string based on the preferred unit
 * @param {string} preferredUnit - "imperial", "metric", or custom unit
 * @returns {string} - Formatted unit string (mi, km, or the custom unit)
 */
export function unitFormattingString(preferredUnit) {
  if (preferredUnit === "Imperial".toLowerCase()) {
    return "mi";
  } else if (preferredUnit === "Metric".toLowerCase()) {
    return "km";
  } else {
    return preferredUnit;
  }
}

/**
 * Formats a date in the US format (Month Day, Year)
 * @param {Date|string} date - Date object or date string
 * @returns {string} - Formatted date string
 */
export function formatRoundDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function secondsConversion(timeInSeconds) {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  if (seconds === 0) {
    return { minutes, seconds: "00" }; // when seconds is zero, pad with zeros
  }
  return { minutes, seconds };
}

export function distanceConversion(distanceInFeet, measurementSystem) {
  let distance = parseFloat(distanceInFeet);

  if (measurementSystem === "metric") {
    // return convertFeetToKilometers(distance).toPrecision(2) + ` ${unitFormattingString(userPreferredUnit)}`
    const kilometers = parseFloat(convertFeetToKilometers(distance));
    return `${kilometers.toFixed(2)} ${unitFormattingString(measurementSystem)}`;
  } else if (measurementSystem === "imperial") {
    // return convertFeetToMiles(distance).toPrecision(2) + ` ${unitFormattingString(userPreferredUnit)}`
    const miles = parseFloat(convertFeetToMiles(distance));
    return `${miles.toFixed(2)} ${unitFormattingString(measurementSystem)}`;
  } else return distance.toFixed(2);
}
