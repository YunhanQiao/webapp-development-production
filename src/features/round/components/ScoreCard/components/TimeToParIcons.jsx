import React from "react";
import { ReactComponent as RabbitSVG } from "../../../icons/rabbit.svg";
import { ReactComponent as TortoiseSVG } from "../../../icons/tortoise.svg";

const TimeToParIcons = ({ timeToPar }) => {
  if (timeToPar === undefined || timeToPar === null || timeToPar === 0) return null;

  const getIconCount = value => {
    const absValue = Math.abs(value);
    if (absValue > 60) return 4;
    if (absValue > 40) return 3;
    if (absValue > 20) return 2;
    return 1;
  };

  const iconCount = getIconCount(timeToPar);
  const Icon = timeToPar > 0 ? RabbitSVG : TortoiseSVG;
  const iconColor = timeToPar > 0 ? "#22c55e" : "#ef4444"; // Green for tortoise, Red for rabbit

  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center bg-white"
      style={{ marginTop: "-10px", gap: "1px" }}
    >
      {[...Array(iconCount)].map((_, index) => (
        <Icon key={index} style={{ fill: iconColor, width: "14px", height: "14px" }} className="flex-shrink-0" />
      ))}
    </div>
  );
};

export default TimeToParIcons;
