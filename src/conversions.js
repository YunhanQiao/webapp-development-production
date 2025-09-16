/*************************************************************************
 * File: conversions.js
 * This file contains functions for converting from feet (the units in
 * which distances and elevations are stored in SpeedScore's database)
 * and various imperial and metric units. In addition, a function
 * toTimePar() converts seconds to a pretty-printed time par (or
 * speedgolf score) in the format 'mm:ss'.
 ************************************************************************/

export function toSGPar(strokePar, timePar) {
  if (strokePar === "" || timePar === "") return "";
  const intStrokePar = parseInt(strokePar);
  const intTimePar = parseInt(timePar);
  const SGParSec = intStrokePar * 60 + intTimePar;
  return Math.floor(SGParSec / 60) + ":" + (SGParSec % 60 < 10 ? "0" + (SGParSec % 60) : SGParSec % 60);
}

export function toTimePar(sec) {
  const intSec = parseInt(sec);
  return Math.floor(intSec / 60) + ":" + (intSec % 60 < 10 ? "0" + (intSec % 60) : intSec % 60);
}

export function toYards(ft) {
  if (ft === "") return "";
  return Math.round(Number(ft) / 3);
}

export function toMiles(ft) {
  if (ft === "") return "";
  return (parseInt(ft) / 5280).toFixed(2);
}

export function toMeters(ft) {
  if (ft === "") return "";
  return Math.round(parseInt(ft) / 3.28084);
}

export function toKilometers(ft) {
  if (ft === "") return "";
  return (parseInt(ft) / 3280.84).toFixed(2);
}

export function toDistUnits(units, ft) {
  if (units === "yards") return toYards(ft);
  else if (units === "miles") return toMiles(ft);
  else if (units === "meters") return toMeters(ft);
  //units === "kilometers"
  else return toKilometers(ft);
}

export function yardsToFeet(yards) {
  return yards * 3;
}

export function metersToFeet(meters) {
  return meters * 3.28084;
}

export function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === "-" || timeStr === "--:--") return 0;
  if (!timeStr.includes(":")) return parseInt(timeStr, 10) || 0;

  const parts = timeStr.split(":");
  if (parts.length === 2) {
    // mm:ss format (speedgolf scores are always minutes:seconds)
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  // Speedgolf scores should never have hours, so return 0 for invalid formats
  return 0;
}
