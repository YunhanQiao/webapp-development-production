import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { CURRENCY_OPTIONS } from "../../constants";
import { SWAG_SIZES } from "../../tournamentSchema";
import { activeTournamentSelector, wizardStateSelector } from "../../competitionSelectors";
import {
  updateWizardTab,
  updateRegistrationOpenOffset,
  updateRegistrationCloseOffset,
  updateWithdrawalDeadlineOffset,
} from "../../competitionSlice";
import { convertDateToOffset, convertOffsetToDate } from "../../../../utils/dateOffsetUtils";
import { format, isValid } from "date-fns";
import { SUPPORTED_CURRENCIES } from "../../utils/currencyUtils";

const EnhancedCheckbox = ({
  id,
  label,
  register,
  disabled = false,
  className = "",
  comingSoon = false,
  isCapReg = false,
  capRegProps = {},
}) => {
  return (
    <Form.Group as={Row} className="mb-3 align-items-center" controlId={id}>
      <Col sm="1" className="text-end">
        <div className="custom-checkbox-container">
          <Form.Check
            className={`enhanced-checkbox ${className}`}
            {...register(id)}
            disabled={disabled}
            style={{
              transform: "scale(1.2)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          />
          <style jsx>{`
            .custom-checkbox-container {
              position: relative;
            }
            .enhanced-checkbox {
              position: relative;
            }
            .enhanced-checkbox input[type="checkbox"] {
              width: 20px;
              height: 20px;
              border: 2px solid #000000;
              border-radius: 4px;
              background-color: white;
              appearance: none;
              -webkit-appearance: none;
              -moz-appearance: none;
              cursor: ${disabled ? "not-allowed" : "pointer"};
            }
            .enhanced-checkbox input[type="checkbox"]:checked {
              background-color: #53d3f6;
              border-color: #131313;
              position: relative;
            }
            .enhanced-checkbox input[type="checkbox"]:disabled {
              background-color: #e9ecef;
              border-color: #ced4da;
              cursor: not-allowed;
              opacity: 0.6;
            }
          `}</style>
        </div>
      </Col>
      <Col sm={isCapReg ? "2" : undefined} className="d-flex align-items-center">
        <Form.Label className="m-0 d-flex align-items-center">
          {label}
          {comingSoon && <span className="text-muted fst-italic ms-2">(Coming Soon)</span>}
        </Form.Label>
      </Col>

      {isCapReg && (
        <Col sm="2">
          <Form.Control
            type="number"
            className="form-control"
            min={0}
            value={capRegProps.value || ""}
            onChange={e => {
              const newValue = e.target.value;
              capRegProps.setValue("capRegAt", newValue || 9999);
              if (capRegProps.setDisplayValue) {
                capRegProps.setDisplayValue(newValue);
              }
            }}
            disabled={!capRegProps.capReg}
            placeholder={capRegProps.capReg ? "40" : "No limit"}
          />
        </Col>
      )}
    </Form.Group>
  );
};

const EnhancedSizeSelection = ({ sizes, currentSizes, handleChange }) => {
  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      {sizes.map(size => (
        <div key={size} className="size-checkbox-container">
          <input
            type="checkbox"
            id={size}
            value={size}
            checked={currentSizes.includes(size)}
            onChange={handleChange}
            className="size-checkbox-input"
          />
          <label htmlFor={size} className="size-checkbox-label">
            {size}
          </label>
          <style jsx>{`
            .size-checkbox-container {
              position: relative;
              display: inline-block;
              margin-right: 8px;
            }
            .size-checkbox-input {
              position: absolute;
              opacity: 0;
              cursor: pointer;
              height: 0;
              width: 0;
            }
            .size-checkbox-label {
              display: inline-block;
              background-color: #f8f9fa;
              color: #212529;
              font-weight: 500;
              padding: 8px 16px;
              border: 2px solid #000000;
              border-radius: 6px;
              cursor: pointer;
              user-select: none;
              margin: 0;
            }
            .size-checkbox-input:checked + .size-checkbox-label {
              background-color: #53d3f6;
              color: white;
              border-color: #000000;
            }
          `}</style>
        </div>
      ))}
    </div>
  );
};

const TournamentRegPaym = () => {
  const dispatch = useDispatch();
  const activeTournament = useSelector(activeTournamentSelector);
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

  const [displayValue, setDisplayValue] = useState("");

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

  useEffect(() => {
    if (!tournamentPaymentInfo.capReg) {
      setDisplayValue("");
    } else {
      setDisplayValue(tournamentPaymentInfo.capRegAt || "");
    }
  }, [tournamentPaymentInfo.capReg, tournamentPaymentInfo.capRegAt]);

  useEffect(() => {
    if (tournamentPaymentInfo.payThroughApp) {
      const currentProcessingPercent = tournamentPaymentInfo.processingPercent;
      const currentProcessingFee = tournamentPaymentInfo.processingFee;

      if (!currentProcessingPercent || currentProcessingPercent < 2.9) {
        handleTournamentPaymentInfoChange("processingPercent", 2.9);
      }
      if (!currentProcessingFee || currentProcessingFee < 0.3) {
        handleTournamentPaymentInfoChange("processingFee", 0.3);
      }
    } else {
      handleTournamentPaymentInfoChange("processingPercent", "0.00");
      handleTournamentPaymentInfoChange("processingFee", "0.00");
    }
  }, [tournamentPaymentInfo.payThroughApp, handleTournamentPaymentInfoChange]);

  const validateProcessingPercent = value => {
    return value >= 2.9 || "Processing percentage cannot be less than 2.90%";
  };

  const validateProcessingFee = value => {
    return value >= 0.3 || "Flat transaction fee cannot be less than $0.30";
  };

  // 🎯 FORMAT DATES FOR DISPLAY - Only keep what we actually use
  const getLocalDateString = dateStr => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  const maximumRegDate = startDate || "";

  // 🎯 SYNC WITHDRAWAL DATE WITH REGISTRATION END DATE
  useEffect(() => {
    if (calculatedRegCloseDate && (!calculatedWithdrawalDeadline || !isValid(new Date(calculatedWithdrawalDeadline)))) {
      // Auto-set withdrawal deadline to same as registration close if not set
      if (startDate) {
        dispatch(updateWithdrawalDeadlineOffset({ withdrawalDeadlineOffset: registrationCloseOffset }));
      }
    }
  }, [calculatedRegCloseDate, calculatedWithdrawalDeadline, startDate, registrationCloseOffset, dispatch]);

  return (
    <>
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

      <Form.Group as={Row} className="mb-3 align-items-center" controlId="capRegAt">
        <Col sm="1" className="text-end">
          <div className="custom-checkbox-container">
            <Form.Check
              className="enhanced-checkbox"
              {...register("capReg")}
              style={{
                transform: "scale(1.2)",
                cursor: "pointer",
              }}
            />
            <style jsx>{`
              .custom-checkbox-container {
                position: relative;
              }
              .enhanced-checkbox {
                position: relative;
              }
              .enhanced-checkbox input[type="checkbox"] {
                width: 20px;
                height: 20px;
                border: 2px solid #000000;
                border-radius: 4px;
                background-color: white;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                cursor: pointer;
                transition: all 0.2s ease;
              }
              .enhanced-checkbox input[type="checkbox"]:hover {
                background-color: #e9f0ff;
              }
              .enhanced-checkbox input[type="checkbox"]:checked {
                background-color: #000000;
                position: relative;
                border-color: #0d6efd;
              }
            `}</style>
          </div>
        </Col>
        <Col sm="2" className="d-flex align-items-center">
          <Form.Label className="m-0">Cap registration at:</Form.Label>
        </Col>
        <Col sm="2">
          <Form.Control
            type="number"
            className="form-control"
            min={0}
            value={displayValue}
            onChange={e => {
              const newValue = e.target.value;
              setDisplayValue(newValue);
              setValue("capRegAt", newValue || 9999);
            }}
            disabled={!capReg}
            placeholder={capReg ? "40" : "No limit"}
          />
        </Col>
      </Form.Group>

      <EnhancedCheckbox
        id="adminApproval"
        label="Require tournament admin to approve each registration"
        register={register}
        disabled={true}
        comingSoon={true}
      />

      <Form.Group as={Row} className="mb-3" controlId="currencyType">
        <Col sm="1" />
        <Col sm="3" className="d-flex align-items-center">
          <Form.Label className="m-0">Currency type for registration payments</Form.Label>
        </Col>
        <Col sm="2">
          <Form.Select {...register("currencyType")}>
            {Object.values(SUPPORTED_CURRENCIES).map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col sm="6">{/* <span className="text-muted fst-italic">(More currencies coming soon)</span> */}</Col>
      </Form.Group>

      <EnhancedCheckbox
        id="payThroughApp"
        label="Have registrants pay entry fee through SpeedScore (fee for each division specified in 'Divisions' step)"
        register={register}
      />

      <Form.Group as={Row} className="mb-3">
        <Col sm="1" />
        <Col sm="2">Processing fees:</Col>
        <Col className="d-flex gap-3 align-items-center">
          <Form.Label className="m-0" htmlFor="processingPercent">
            Percentage of Transaction:
          </Form.Label>
          <div className="d-flex align-items-center">
            <input
              type="number"
              id="processingPercent"
              step={0.01}
              min={2.9}
              {...register("processingPercent", {
                onBlur: e => setValue("processingPercent", Math.max(2.9, Number(e.target.value)).toFixed(2)),
                validate: validateProcessingPercent,
              })}
            />
            <span className="ms-1">%</span>
          </div>
          <i className="fa fa-solid fa-plus fa-2x" />
          <Form.Label className="m-0" htmlFor="processingFee">
            Flat Transaction Fee:
          </Form.Label>
          <div className="d-flex align-items-center">
            <span className="me-1">$</span>
            <input
              type="number"
              id="processingFee"
              step={0.01}
              min={0.3}
              {...register("processingFee", {
                onBlur: e => setValue("processingFee", Math.max(0.3, Number(e.target.value)).toFixed(2)),
                validate: validateProcessingFee,
              })}
            />
          </div>
        </Col>
      </Form.Group>

      <EnhancedCheckbox
        id="askSwag"
        label="Ask registrant their size for swag included with registration fee"
        register={register}
      />

      <Form.Group as={Row} className="align-items-center mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0" htmlFor="swagName">
            Swag Name:
          </Form.Label>
        </Col>
        <Col sm="2">
          <Form.Control type="text" id="swagName" {...register("swagName")} />
        </Col>
        <Col sm="2">Unisex Sizes to include:</Col>
        <Col>
          <EnhancedSizeSelection sizes={SWAG_SIZES} currentSizes={currentSwagSizes} handleChange={handleSizesChange} />
        </Col>
      </Form.Group>
    </>
  );
};

export default TournamentRegPaym;
