import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { wizardStateSelector } from "../../competitionSelectors";
import {
  updateWizardTab,
  updateRegistrationOpenOffset,
  updateRegistrationCloseOffset,
  updateWithdrawalDeadlineOffset,
} from "../../competitionSlice";
import { convertDateToOffset, convertOffsetToDate } from "../../../../utils/dateOffsetUtils";
import { isValid } from "date-fns";

const TournamentRegPaym = () => {
  const dispatch = useDispatch();
  const wizardState = useSelector(wizardStateSelector);

  // 🎯 CONTROLLED COMPONENT STATE - Get values from wizardState
  const tournamentPaymentInfo = useMemo(
    () => wizardState?.tournamentPaymentInfo || {},
    [wizardState?.tournamentPaymentInfo],
  );
  const startDate = wizardState?.basicInfo?.startDate;

  // 🎯 CALCULATE REGISTRATION DATES FROM OFFSETS
  const registrationOpenOffset = tournamentPaymentInfo.registrationOpenOffset || -30;
  const registrationCloseOffset = tournamentPaymentInfo.registrationCloseOffset || -3;
  const withdrawalDeadlineOffset = tournamentPaymentInfo.withdrawalDeadlineOffset || -7;

  const calculatedRegOpenDate = useMemo(() => {
    return startDate ? convertOffsetToDate(registrationOpenOffset, startDate) : "";
  }, [startDate, registrationOpenOffset]);

  const calculatedRegCloseDate = useMemo(() => {
    return startDate ? convertOffsetToDate(registrationCloseOffset, startDate) : "";
  }, [startDate, registrationCloseOffset]);

  const calculatedWithdrawalDeadline = useMemo(() => {
    return startDate ? convertOffsetToDate(withdrawalDeadlineOffset, startDate) : "";
  }, [startDate, withdrawalDeadlineOffset]);

  // 🎯 CONTROLLED COMPONENT CHANGE HANDLERS - Update wizardState directly
  const handleRegistrationOpenDateChange = useCallback(
    e => {
      const newDate = e.target.value;
      if (startDate && newDate) {
        const newOffset = convertDateToOffset(newDate, startDate);
        dispatch(updateRegistrationOpenOffset({ registrationOpenOffset: newOffset }));
      }
    },
    [dispatch, startDate],
  );

  const handleRegistrationCloseDateChange = useCallback(
    e => {
      const newDate = e.target.value;
      if (startDate && newDate) {
        const newOffset = convertDateToOffset(newDate, startDate);
        dispatch(updateRegistrationCloseOffset({ registrationCloseOffset: newOffset }));
      }
    },
    [dispatch, startDate],
  );

  const handleWithdrawalDeadlineChange = useCallback(
    e => {
      const newDate = e.target.value;
      if (startDate && newDate) {
        const newOffset = convertDateToOffset(newDate, startDate);
        dispatch(updateWithdrawalDeadlineOffset({ withdrawalDeadlineOffset: newOffset }));
      }
    },
    [dispatch, startDate],
  );

  const handleTournamentPaymentInfoChange = useCallback(
    (field, value) => {
      dispatch(
        updateWizardTab({
          tab: "tournamentPaymentInfo",
          data: { ...tournamentPaymentInfo, [field]: value },
        }),
      );
    },
    [dispatch, tournamentPaymentInfo],
  );

  // 🎯 SYNC WITHDRAWAL DATE WITH REGISTRATION END DATE
  useEffect(() => {
    if (calculatedRegCloseDate && (!calculatedWithdrawalDeadline || !isValid(new Date(calculatedWithdrawalDeadline)))) {
      // Auto-set withdrawal deadline to same as registration close if not set
      if (startDate) {
        dispatch(updateWithdrawalDeadlineOffset({ withdrawalDeadlineOffset: registrationCloseOffset }));
      }
    }
  }, [calculatedRegCloseDate, calculatedWithdrawalDeadline, startDate, registrationCloseOffset, dispatch]);

  const maximumRegDate = startDate || "";

  return (
    <>
      {/* 🎯 OFFSET-BASED REGISTRATION DATES */}
      <Form.Group as={Row} className="d-flex align-items-center mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0" htmlFor="regStartDate">
            Registration Window:
          </Form.Label>
        </Col>
        <Col className="d-flex gap-3 align-items-center" sm="5">
          <Form.Control
            type="date"
            id="regStartDate"
            max={maximumRegDate}
            value={calculatedRegOpenDate}
            onChange={handleRegistrationOpenDateChange}
          />
          <Form.Label className="m-0" htmlFor="regEndDate">
            to
          </Form.Label>
          <Form.Control
            type="date"
            id="regEndDate"
            max={maximumRegDate}
            value={calculatedRegCloseDate}
            onChange={handleRegistrationCloseDateChange}
          />
        </Col>
        <Col>(Anywhere on Earth)</Col>
      </Form.Group>

      <Form.Group as={Row} className="d-flex align-items-center mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0" htmlFor="maxWithdrawalDate">
            Allow Withdrawal until:
          </Form.Label>
        </Col>
        <Col className="d-flex gap-3 align-items-center" sm="5">
          <Form.Control
            type="date"
            id="maxAllowedWithdraDate"
            max={maximumRegDate}
            value={calculatedWithdrawalDeadline}
            onChange={handleWithdrawalDeadlineChange}
          />
        </Col>
      </Form.Group>

      {/* 🎯 BASIC ENTRY FEE FIELD */}
      <Form.Group as={Row} className="mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0">Entry Fee:</Form.Label>
        </Col>
        <Col sm="3">
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            value={tournamentPaymentInfo.entryFee || ""}
            onChange={e => handleTournamentPaymentInfoChange("entryFee", e.target.value)}
            placeholder="0.00"
          />
        </Col>
      </Form.Group>

      {/* 🎯 PAYMENT METHODS */}
      <Form.Group as={Row} className="mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0">Accept Cash:</Form.Label>
        </Col>
        <Col sm="1">
          <Form.Check
            type="checkbox"
            checked={tournamentPaymentInfo.acceptsCash || false}
            onChange={e => handleTournamentPaymentInfoChange("acceptsCash", e.target.checked)}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0">Accept Check:</Form.Label>
        </Col>
        <Col sm="1">
          <Form.Check
            type="checkbox"
            checked={tournamentPaymentInfo.acceptsCheck || false}
            onChange={e => handleTournamentPaymentInfoChange("acceptsCheck", e.target.checked)}
          />
        </Col>
      </Form.Group>

      {/* 🎯 DEBUG INFO - Show current offset values */}
      <div style={{ background: "#f0f0f0", padding: "10px", margin: "20px 0", fontSize: "12px" }}>
        <strong>🎯 DEBUG - Offset Values:</strong>
        <br />
        Start Date: {startDate}
        <br />
        Registration Open Offset: {registrationOpenOffset} days → {calculatedRegOpenDate}
        <br />
        Registration Close Offset: {registrationCloseOffset} days → {calculatedRegCloseDate}
        <br />
        Withdrawal Deadline Offset: {withdrawalDeadlineOffset} days → {calculatedWithdrawalDeadline}
      </div>
    </>
  );
};

export default TournamentRegPaym;
