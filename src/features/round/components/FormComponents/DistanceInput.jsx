import { convertKmToMiles, convertMilesToKm } from "../../utils";

export function DistanceInput({ distanceUnit, methods, setDistanceUnit }) {
  const { getValues, register, setValue } = methods;

  const distanceUnitHandler = () => {
    setDistanceUnit(prev => (prev === "miles" ? "km" : "miles"));
    const currentDistance = getValues("distance");
    const convertFunction = distanceUnit === "miles" ? convertMilesToKm : convertKmToMiles;

    setValue("distance", convertFunction(currentDistance).toFixed(2));
  };

  const distanceUnitKeyHandler = e => {
    if (e.key === "ArrowRight" && distanceUnit === "miles") {
      distanceUnitHandler();
    }

    if (e.key === "ArrowLeft" && distanceUnit === "km") {
      distanceUnitHandler();
    }
  };

  const format = e => setValue("distance", Number(e.target.value).toFixed(2));

  return (
    <>
      <div className="mb-3">
        <label htmlFor="roundDistance" className="form-label">
          Distance:
          <input
            id="roundDistance"
            className="form-control centered"
            type="number"
            aria-describedby="roundDistanceDescr"
            step={0.01}
            {...register("distance", {
              min: distanceUnit === "miles" ? 0.01 : 0.1,
              max: distanceUnit === "miles" ? 62 : 100,
              onBlur: format,
            })}
          />
        </label>
      </div>
      <div className="d-flex justify-content-center mb-2">
        Miles
        <div className="form-switch">
          <input
            className="form-check-input centered"
            type="checkbox"
            role="switch"
            checked={distanceUnit !== "miles"}
            onChange={distanceUnitHandler}
            onKeyDown={distanceUnitKeyHandler}
          />
        </div>
        Kilometers
      </div>
      <div className="mb-3">
        <div id="roundDistanceDescr" className="form-text">
          Enter a distance value (in miles or km) between 0.01 and 62 miles (100 km)
        </div>
      </div>
    </>
  );
}
