export const convertTo24Hour = time => {
  if (!time || time === "--:--") return "";
  const [timePart, period] = time.split(" ");
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  let hour24 = hours;
  if (period === "PM" && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === "AM" && hours === 12) {
    hour24 = 0;
  }

  return `${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds || 0).padStart(
    2,
    "0",
  )}`;
};

export const formatToAMPM = time => {
  if (!time || time === "--:--") return "";
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${String(formattedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds || 0,
  ).padStart(2, "0")} ${period}`;
};

export const calculateTimeFromFinishAndStart = (startTime, finishTime) => {
  if (!startTime || !finishTime || startTime === "--:--" || finishTime === "--:--") return "--:--";

  const convertToSeconds = time => {
    let [timePart, period] = time.split(" ");
    let [hours, minutes, seconds] = timePart.split(":").map(Number);
    seconds = seconds || 0;

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 3600 + minutes * 60 + seconds;
  };

  let startSeconds = convertToSeconds(startTime);
  let finishSeconds = convertToSeconds(finishTime);

  if (startTime.includes("PM") && finishTime.includes("AM")) {
    finishSeconds += 86400;
  }

  const diffSeconds = finishSeconds - startSeconds;

  if (diffSeconds <= 0) return "--:--";

  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const mmssToMillis = mmss => {
  if (!mmss || mmss === "--:--") return NaN;
  const [m, s] = mmss.split(":").map(Number);
  return (m * 60 + s) * 1000;
};

export const mmssToSeconds = mmss => {
  if (!mmss || mmss === "--:--") return 0;

  const parts = mmss.split(":").map(Number);
  let result;

  if (parts.length === 2) {
    // Format: "mm:ss"
    const [m, s] = parts;
    result = m * 60 + s;
  } else if (parts.length === 3) {
    // Format: "hh:mm:ss"
    const [h, m, s] = parts;
    result = h * 3600 + m * 60 + s;
  } else {
    console.warn("mmssToSeconds: Invalid time format:", mmss);
    return 0;
  }

  return result;
};

export const timeToPar = (actualTimeSeconds, timeParSeconds) => {
  if (!actualTimeSeconds || !timeParSeconds || timeParSeconds === 0) return "";

  const timeDiffSeconds = actualTimeSeconds - timeParSeconds;

  if (timeDiffSeconds === 0) return "(E)";

  const absTimeDiffSeconds = Math.abs(timeDiffSeconds);
  const minutes = Math.floor(absTimeDiffSeconds / 60);
  const seconds = Math.floor(absTimeDiffSeconds % 60); // Round down to integer seconds

  const sign = timeDiffSeconds < 0 ? "-" : "+";
  return `(${sign}${minutes}:${String(seconds).padStart(2, "0")})`;
};

export const secondsToMmss = seconds => {
  if (!seconds || seconds <= 0) return "--:--";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};
