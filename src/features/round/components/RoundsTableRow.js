import { useMemo } from "react";
import { format } from "date-fns/format";

import { computeSGSToPar, computeStrokesToPar, computeTimePar, distanceCalculator, paceCalculator } from "../utils";

import styles from "./index.module.css";

const RoundsTableRow = ({ distanceUnit, onClick, round }) => {
  const { courseId, teesetName } = round;

  const name = `${courseId.shortName} ${teesetName ? "(" + teesetName + ")" : ""}`;
  const date = format(round.date, "MM-dd-yyyy");

  const distance = useMemo(() => {
    const output = distanceCalculator(round.distance, distanceUnit);
    if (output === "Null") {
      return "ND";
    } else {
      return `${output} ${distanceUnit}`;
    }
  }, [round.distance, distanceUnit]);

  const pace = useMemo(() => {
    const roundPace = paceCalculator(round.pace, distanceUnit);

    if (roundPace == null || round.distance === "Null") {
      return "ND";
    }

    return roundPace;
  }, [round.pace, round.distance, distanceUnit]);

  const strokes = useMemo(() => {
    if (round.noOfficialScore) {
      return "ND";
    }
    return `${round.strokes} ${computeStrokesToPar(round.strokesToPar)}`;
  }, [round.strokes, round.strokesToPar]);

  const SGS = useMemo(() => {
    // if no official score. Then we show score as it is
    if (round.noOfficialScore) {
      return "ND";
    }
    return `${round.SGS} ${computeSGSToPar(round.timeToPar, round.strokesToPar)}`;
  }, [round.SGS, round.strokesToPar, round.timeToPar]);

  const time = useMemo(() => {
    const minutes = Math.floor(round.time / 60);
    const seconds = round.time % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")} ${computeTimePar(round.timeToPar)}`;
  }, [round.time, round.timeToPar]);

  return (
    <tr className={styles.round} onClick={() => onClick(round._id)}>
      <td>{date}</td>
      <td>{name}</td>
      <td>{strokes}</td>
      <td>{time}</td>
      <td>{SGS}</td>
      <td>{distance}</td>
      <td>{pace}</td>
    </tr>
  );
};

export default RoundsTableRow;
