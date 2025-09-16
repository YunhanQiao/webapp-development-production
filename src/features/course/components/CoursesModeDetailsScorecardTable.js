import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CoursesModeDetailsScorecardTable = ({
  getFullScorecard,
  course,
  Conversions,
  teeUnits,
  numTabItems,
  handleHoleDataChange,
  autoPopulate
}) => {
  return (
    <>
      <table className='table table-sm table-striped table-hover'>
        <caption>Table of Hole Info</caption>
        <thead className='sticky-head'>
          <tr>
            <th></th>
            <th scope='col' colSpan='2' style={{}}>
              Distance
            </th>
            <th scope='col' colSpan='2'>
              Golf Par
            </th>
            <th scope='col' colSpan='2'>
              Time Par
            </th>
            <th scope='col' colSpan='2'>
              Speedgolf Par
            </th>
            <th scope='col' colSpan='2'>
              Hole Handicap
            </th>
          </tr>
          <tr>
            <th scope='col'>Hole #</th>
            <th scope='col' title='Golf distance, as shown on scorecard'>
              Golf&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th
              scope='col'
              title='Running distance, which should include golf distance plus the transition from the previous hole to this hole. Defaults to golf distance.'
            >
              Running&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th scope='col' title="Men's stroke par, as shown on scorecard">
              Men's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th scope='col' title="Women's stroke par, as shown on scorecard">
              Women's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th
              scope='col'
              title="Men's time par. Computed automatically by multiplying hole's running distance by men's 'par' running pace (7:00/mile) and then adding 'par' shotbox time (15 sec) for each par stroke"
            >
              Men's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th
              scope='col'
              title="Women's time par. Computed automatically by multiplying hole's running distance by women's 'par' running pace (9:00/mile) and then adding 'par' shotbox time (20 sec) for each par stroke"
            >
              Women's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th scope='col' title="Men's speedgolf par. Computed automatically as sum of stroke and time pars">
              Men's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th scope='col' title="Women's speedgolf par. Computed automatically as sum of stroke and time pars">
              Women's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th
              scope='col'
              title="Men's hole handicap, as shown on scorecard. This is a measure of difficulty of this hole relative to others on the course."
            >
              Men's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th
              scope='col'
              title="Women's hole handicap, as shown on scorecard. This is a measure of difficulty of this hole relative to others on the course"
            >
              Women's&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
          </tr>
        </thead>
        <tbody>
          {/* {getFullScorecard(course.tees[teeUnits.selectedTee].holes).map((h) => {
            return [
              <tr key={h.number}>
                <th scope='row'>{h?.number}</th>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    teeUnits.unitConversions.convertToHoleUnits(h.golfDistance) +
                    " " +
                    teeUnits.unitConversions.golfUnitsAbbrev
                  ) : (
                    <input
                      type='number'
                      className='dist-width centered'
                      tabIndex={numTabItems + h.number * 2 - 1}
                      aria-label={"Golf distance for hole " + h.number}
                      value={teeUnits.unitConversions.convertToHoleUnits(h.golfDistance)}
                      onChange={(e) => handleHoleDataChange(e, h.number, "golfDistance", 1, 900)}
                      // onKeyDown={(e) => autoPopulate(e,h.number,"golfDistance","runDistance")
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    teeUnits.unitConversions.convertToTotalUnits(h.runDistance) +
                    " " +
                    teeUnits.unitConversions.runUnitsAbbrev
                  ) : (
                    <input
                      type='number'
                      disabled
                      className='dist-width centered'
                      tabIndex={numTabItems + h.number * 2}
                      aria-label={"Running distance for hole " + h.number}
                      value={teeUnits.unitConversions.convertToHoleUnits(h.runDistance)}
                      onChange={(e) => handleHoleDataChange(e, h.number, "runDistance", 1, 1500)}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    h.mensStrokePar
                  ) : (
                    <input
                      type='number'
                      className='par-width centered'
                      value={h.mensStrokePar}
                      tabIndex={numTabItems + course.numHoles * 2 + h.number * 2 - 1}
                      aria-label={"Men's stroke par for hole " + h.number}
                      onChange={(e) => handleHoleDataChange(e, h.number, "mensStrokePar", 3, 6)}
                      onKeyDown={(e) => autoPopulate(e, h.number, "mensStrokePar", "womensStrokePar")}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    h.womensStrokePar
                  ) : (
                    <input
                      type='number'
                      className='par-width centered'
                      value={h.womensStrokePar}
                      tabIndex={numTabItems + course.numHoles * 2 + h.number * 2}
                      aria-label={"Women's stroke par for hole " + h.number}
                      onChange={(e) => handleHoleDataChange(e, h.number, "womensStrokePar", 3, 6)}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    Conversions.toTimePar(h.mensTimePar)
                  ) : (
                    <input
                      type='text'
                      disabled
                      className='time-width centered'
                      value={h.mensTimePar === "" ? "" : Conversions.toTimePar(h.mensTimePar)}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    Conversions.toTimePar(h.womensTimePar)
                  ) : (
                    <input
                      type='text'
                      disabled
                      className='time-width centered'
                      value={h.womensTimePar === "" ? "" : Conversions.toTimePar(h.womensTimePar)}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    Conversions.toSGPar(h.mensStrokePar, h.mensTimePar)
                  ) : (
                    <input
                      type='text'
                      disabled
                      className='time-width centered'
                      value={Conversions.toSGPar(h.mensStrokePar, h.mensTimePar)}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    Conversions.toSGPar(h.womensStrokePar, h.womensTimePar)
                  ) : (
                    <input
                      type='text'
                      disabled
                      className='time-width centered'
                      value={Conversions.toSGPar(h.womensStrokePar, h.womensTimePar)}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    ""
                  ) : (
                    <input
                      type='number'
                      className='par-width centered'
                      value={h.mensHandicap}
                      tabIndex={numTabItems + course.numHoles * 4 + h.number * 2 - 1}
                      aria-label={"Men's handicap for hole " + h.number}
                      onChange={(e) => handleHoleDataChange(e, h.number, "mensHandicap", 1, course.numHoles)}
                      onKeyDown={(e) => autoPopulate(e, h.number, "mensHandicap", "womensHandicap")}
                    />
                  )}
                </td>
                <td>
                  {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                    ""
                  ) : (
                    <input
                      type='number'
                      className='par-width centered'
                      value={h.womensHandicap}
                      tabIndex={numTabItems + course.numHoles * 4 + h.number * 2}
                      aria-label={"Women's handicap for hole " + h.number}
                      onChange={(e) => handleHoleDataChange(e, h.number, "womensHandicap", 1, course.numHoles)}
                    />
                  )}
                </td>
              </tr>,
            ];
          })} */}
          {course.tees[teeUnits.selectedTee]?.holes ? (
            getFullScorecard(course.tees[teeUnits.selectedTee].holes).map(h => {
              return (
                <tr key={h.number}>
                  <th scope='row'>{h?.number || "Hole number not available"}</th>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      teeUnits.unitConversions.convertToHoleUnits(h.golfDistance) +
                      " " +
                      teeUnits.unitConversions.golfUnitsAbbrev
                    ) : (
                      <input
                        type='number'
                        className='dist-width centered'
                        tabIndex={numTabItems + h.number * 2 - 1}
                        aria-label={"Golf distance for hole " + h.number}
                        value={teeUnits.unitConversions.convertToHoleUnits(h.golfDistance)}
                        onChange={e => handleHoleDataChange(e, h.number, "golfDistance", 1, 900)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      teeUnits.unitConversions.convertToTotalUnits(h.runDistance) +
                      " " +
                      teeUnits.unitConversions.runUnitsAbbrev
                    ) : (
                      <input
                        type='number'
                        disabled
                        className='dist-width centered'
                        tabIndex={numTabItems + h.number * 2}
                        aria-label={"Running distance for hole " + h.number}
                        value={teeUnits.unitConversions.convertToHoleUnits(h.runDistance)}
                        onChange={e => handleHoleDataChange(e, h.number, "runDistance", 1, 1500)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      h.mensStrokePar
                    ) : (
                      <input
                        type='number'
                        className='par-width centered'
                        value={h.mensStrokePar}
                        tabIndex={numTabItems + course.numHoles * 2 + h.number * 2 - 1}
                        aria-label={"Men's stroke par for hole " + h.number}
                        onChange={e => handleHoleDataChange(e, h.number, "mensStrokePar", 3, 6)}
                        onKeyDown={e => autoPopulate(e, h.number, "mensStrokePar", "womensStrokePar")}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      h.womensStrokePar
                    ) : (
                      <input
                        type='number'
                        className='par-width centered'
                        value={h.womensStrokePar}
                        tabIndex={numTabItems + course.numHoles * 2 + h.number * 2}
                        aria-label={"Women's stroke par for hole " + h.number}
                        onChange={e => handleHoleDataChange(e, h.number, "womensStrokePar", 3, 6)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      Conversions.toTimePar(h.mensTimePar)
                    ) : (
                      <input
                        type='text'
                        disabled
                        className='time-width centered'
                        value={h.mensTimePar === "" ? "" : Conversions.toTimePar(h.mensTimePar)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      Conversions.toTimePar(h.womensTimePar)
                    ) : (
                      <input
                        type='text'
                        disabled
                        className='time-width centered'
                        value={h.womensTimePar === "" ? "" : Conversions.toTimePar(h.womensTimePar)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      Conversions.toSGPar(h.mensStrokePar, h.mensTimePar)
                    ) : (
                      <input
                        type='text'
                        disabled
                        className='time-width centered'
                        value={Conversions.toSGPar(h.mensStrokePar, h.mensTimePar)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      Conversions.toSGPar(h.womensStrokePar, h.womensTimePar)
                    ) : (
                      <input
                        type='text'
                        disabled
                        className='time-width centered'
                        value={Conversions.toSGPar(h.womensStrokePar, h.womensTimePar)}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      ""
                    ) : (
                      <input
                        type='number'
                        className='par-width centered'
                        value={h.mensHandicap}
                        tabIndex={numTabItems + course.numHoles * 4 + h.number * 2 - 1}
                        aria-label={"Men's handicap for hole " + h.number}
                        onChange={e => handleHoleDataChange(e, h.number, "mensHandicap", 1, course.numHoles)}
                        onKeyDown={e => autoPopulate(e, h.number, "mensHandicap", "womensHandicap")}
                      />
                    )}
                  </td>
                  <td>
                    {h.number === "OUT" || h.number === "IN" || h.number === "TOTAL" ? (
                      ""
                    ) : (
                      <input
                        type='number'
                        className='par-width centered'
                        value={h.womensHandicap}
                        tabIndex={numTabItems + course.numHoles * 4 + h.number * 2}
                        aria-label={"Women's handicap for hole " + h.number}
                        onChange={e => handleHoleDataChange(e, h.number, "womensHandicap", 1, course.numHoles)}
                      />
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan='11' className='text-center'>
                Pease wait...currently no hole data available for the tee
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

export default CoursesModeDetailsScorecardTable;
