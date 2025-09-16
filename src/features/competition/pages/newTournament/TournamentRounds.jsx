import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import useRounds from "../../hooks/useRounds";

import { useEffect, useState } from "react";
import "../../../../styles/features/competition/newTournament.css";
import { useSelector } from "react-redux";
import { activeTournamentSelector } from "../../competitionSelectors";
import { format } from "date-fns/format";
import { formatDate } from "../../../../services/competitionServices";
import isEmpty from "lodash/isEmpty";
import ErrorMessage from "features/shared/BaseFormComponents/ErrorMessage";

const MAX_ROUNDS = 4;

const TournamentRounds = () => {
  const dummySelectOptions = Array(MAX_ROUNDS).fill();
  const activeTournament = useSelector(activeTournamentSelector);
  // console.log("activeTournamentasdfasdfasdfafsd", activeTournament);
  const roundsLength = activeTournament?.rounds?.roundsInfo?.length
    ? activeTournament.rounds.roundsInfo.length
    : activeTournament?.rounds?.length
      ? activeTournament.rounds.length
      : 1;
  const [rounds, setRounds] = useState(roundsLength);
  const [roundsArray, setRoundsArray] = useState([]);
  const startDate = activeTournament?.basicInfo?.startDate;
  const minRoundDate = startDate ? format(new Date(startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  const endDate = activeTournament?.basicInfo?.endDate;
  const maxRoundDate = startDate ? format(new Date(endDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  const { methods, updateRoundsInfo, setRoundValue } = useRounds();
  const {
    register,
    formState: { errors },
  } = methods;
  const [roundsData, setRoundsData] = useState([]);

  useEffect(() => {
    const newComponentsArray = new Array(rounds).fill(0);
    setRoundsArray(newComponentsArray);
  }, [rounds]);

  useEffect(() => {
    if (activeTournament?.rounds?.roundsInfo?.length > 0) {
      setRoundsData(activeTournament.rounds.roundsInfo);
    } else if (activeTournament?.rounds?.length > 0) {
      setRoundsData(activeTournament.rounds);
    } else {
      setRoundsData([]); // fallback to an empty array
    }
  }, [activeTournament]);

  useEffect(() => {
    if (activeTournament?.rounds && activeTournament?.rounds.length > 0) {
      activeTournament.rounds.forEach((round, idx) => {
        setRoundValue(idx, round.date, round.format);
        // console.log("idx, round.date, round.format", idx, round.date, round.format);
      });
    }
  }, [activeTournament]);

  // useEffect(() => {
  //   const roundsInfo = getValues("roundsInfo");
  //   // const regEndDate = getValues("regEndDate");
  //   setValue("regStartDate", formatDate(regStartDate));
  //   setValue("regEndDate", formatDate(regEndDate));
  // },[ ]);

  const handleRoundsChange = e => {
    const numRounds = Number(e.target.value);
    setRounds(numRounds);
    console.log("numrounds", numRounds);
    updateRoundsInfo(numRounds);
  };

  return (
    <>
      {!isEmpty(errors.roundsInfo) && (
        <div className="alert alert-danger" id="updateRoundsErrorBox">
          {errors.roundsInfo.map((roundError, idx) => (
            <div key={idx}>
              {Object.entries(roundError).map(([field, errorDetails]) => (
                <ErrorMessage key={`${field}-${idx}`} id={`${field}-${idx}`}>
                  {`Round ${idx + 1}: ${errorDetails.message}`}
                </ErrorMessage>
              ))}
            </div>
          ))}
        </div>
      )}
      <Form.Group as={Row} className="mb-5" controlId="roundsCount">
        <Form.Label column sm="3" className="text-end">
          Number of Tournament Rounds:
        </Form.Label>
        <Col sm="1">
          <Form.Select value={rounds} onChange={handleRoundsChange}>
            {dummySelectOptions.map((_, index) => (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Form.Group>
      <Col sm="3" className="ms-5" id="roundsDetails">
        {roundsArray.map((_, idx) => (
          <fieldset key={idx} className="rounds-container mb-3">
            <legend className="rounds-title">Round {idx + 1}</legend>
            <Form.Group as={Row} className="mb-3" controlId="tournamentDates">
              <Form.Label column sm="3" className="text-start">
                Date:
              </Form.Label>
              <Col sm="3">
                <input
                  id={`startDate-${idx}`}
                  className="form-control-sm"
                  type="date"
                  min={minRoundDate}
                  max={maxRoundDate}
                  defaultValue={roundsData[idx]?.date ? formatDate(roundsData[idx].date) : ""}
                  aria-describedby="roundDateDescr"
                  {...register(`roundsInfo[${idx}].date`, { required: true })}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="tournamentDates">
              <Form.Label column sm="3">
                Format:
              </Form.Label>
              <Col sm="6">
                <Form.Select
                  {...register(`roundsInfo.${idx}.format`, { required: true })}
                  defaultValue={roundsData[idx]?.format || "Speedgolf"}
                >
                  <option value="Speedgolf">Speedgolf</option>
                  <option value="Sprintgolf">Sprintgolf</option>
                </Form.Select>
              </Col>
            </Form.Group>
          </fieldset>
        ))}
      </Col>
    </>
  );
};

export default TournamentRounds;
