import { Fragment, useEffect, useMemo, useCallback } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { SWAG_SIZES } from "../../tournamentSchema";
import { wizardStateSelector } from "../../competitionSelectors";
import {
  updateWizardTab,
  updateRegistrationOpenOffset,
  updateRegistrationCloseOffset,
  updateWithdrawalDeadlineOffset,
} from "../../competitionSlice";
import { convertDateToOffset, convertOffsetToDate } from "../../../../utils/dateOffsetUtils";
import { isValid } from "date-fns";
import { SUPPORTED_CURRENCIES } from "../../utils/currencyUtils";

const EnhancedCheckbox = ({
  id,
  label,
  checked = false,
  onChange,
  disabled = false,
  className = "",
  comingSoon = false,
}) => {
  return (
    <Form.Group as={Row} className="mb-3 align-items-center" controlId={id}>
      <Col sm="1" className="text-end">
        <div className="custom-checkbox-container" style={{ position: "relative", display: "inline-block" }}>
          <input
            type="checkbox"
            id={id}
            className={`enhanced-checkbox ${className}`}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #000000",
              borderRadius: "4px",
              backgroundColor: checked ? "#53d3f6" : "white",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              transform: "scale(1.2)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              position: "relative",
            }}
          />
          {checked && (
            <span
              style={{
                position: "absolute",
                left: "5px",
                top: "2px",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
                pointerEvents: "none",
                transform: "scale(1.2)",
              }}
            >
              ✓
            </span>
          )}
        </div>
      </Col>
      <Col className="d-flex align-items-center">
        <Form.Label className="m-0 d-flex align-items-center">
          {label}
          {comingSoon && <span className="text-muted fst-italic ms-2">(Coming Soon)</span>}
        </Form.Label>
      </Col>
    </Form.Group>
  );
};

const EnhancedSizeSelection = ({ sizes, currentSizes, handleChange }) => {
  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      {sizes.map(size => (
        <div
          key={size}
          className="size-checkbox-container"
          style={{ position: "relative", display: "inline-block", marginRight: "8px" }}
        >
          <input
            type="checkbox"
            id={size}
            value={size}
            checked={currentSizes.includes(size)}
            onChange={handleChange}
            className="size-checkbox-input"
            style={{
              position: "absolute",
              opacity: 0,
              cursor: "pointer",
              height: 0,
              width: 0,
            }}
          />
          <label
            htmlFor={size}
            className="size-checkbox-label"
            style={{
              display: "inline-block",
              backgroundColor: currentSizes.includes(size) ? "#53d3f6" : "#f8f9fa",
              color: currentSizes.includes(size) ? "white" : "#212529",
              fontWeight: 500,
              padding: "8px 16px",
              border: "2px solid #000000",
              borderRadius: "6px",
              cursor: "pointer",
              userSelect: "none",
              margin: 0,
            }}
          >
            {size}
          </label>
        </div>
      ))}
    </div>
  );
};

const TournamentRegPaym = () => {
  const dispatch = useDispatch();
  const wizardState = useSelector(wizardStateSelector);

  // 🎯 CONTROLLED COMPONENT STATE - Get values from wizardState
  const regPayment = useMemo(() => wizardState?.regPayment || {}, [wizardState?.regPayment]);
  const startDate = wizardState?.basicInfo?.startDate;

  // 🎯 CALCULATE REGISTRATION DATES FROM OFFSETS
  const registrationOpenOffset = regPayment.registrationOpenOffset ?? -30;
  const registrationCloseOffset = regPayment.registrationCloseOffset ?? -3;
  const withdrawalDeadlineOffset = regPayment.withdrawalDeadlineOffset ?? -1; // Default to 1 day before tournament

  const calculatedRegOpenDate = useMemo(() => {
    const result = startDate ? convertOffsetToDate(registrationOpenOffset, startDate) : "";
    return result;
  }, [startDate, registrationOpenOffset]);

  const calculatedRegCloseDate = useMemo(() => {
    const result = startDate ? convertOffsetToDate(registrationCloseOffset, startDate) : "";
    return result;
  }, [startDate, registrationCloseOffset]);

  const calculatedWithdrawalDeadline = useMemo(() => {
    const result = startDate ? convertOffsetToDate(withdrawalDeadlineOffset, startDate) : "";
    console.log("🔍 Registration dates debug:", {
      startDate,
      withdrawalDeadlineOffset,
      calculatedWithdrawalDeadline: result,
      isValidDate: result ? isValid(new Date(result)) : false,
    });
    return result;
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

  const handleregPaymentInfoChange = useCallback(
    (field, value) => {
      dispatch(
        updateWizardTab({
          tab: "regPayment",
          data: { ...regPayment, [field]: value },
        }),
      );
    },
    [dispatch, regPayment],
  );

  // Handle swag sizes
  const currentSwagSizes = useMemo(() => regPayment.swagSizes || [], [regPayment.swagSizes]);
  const handleSizesChange = useCallback(
    e => {
      const { value, checked } = e.target;
      let newSizes;
      if (checked) {
        newSizes = [...currentSwagSizes, value];
      } else {
        newSizes = currentSwagSizes.filter(size => size !== value);
      }
      handleregPaymentInfoChange("swagSizes", newSizes);
    },
    [currentSwagSizes, handleregPaymentInfoChange],
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

      {/* CAP REGISTRATION */}
      <Form.Group as={Row} className="mb-3 align-items-center">
        <Col sm="1" className="text-end">
          <div className="custom-checkbox-container" style={{ position: "relative", display: "inline-block" }}>
            <input
              type="checkbox"
              className="enhanced-checkbox"
              checked={regPayment.capReg || false}
              onChange={e => handleregPaymentInfoChange("capReg", e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #000000",
                borderRadius: "4px",
                backgroundColor: regPayment.capReg ? "#53d3f6" : "white",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                transform: "scale(1.2)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            />
            {regPayment.capReg && (
              <span
                style={{
                  position: "absolute",
                  left: "5px",
                  top: "2px",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  pointerEvents: "none",
                  transform: "scale(1.2)",
                }}
              >
                ✓
              </span>
            )}
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
            value={regPayment.capRegAt || ""}
            onChange={e => handleregPaymentInfoChange("capRegAt", e.target.value || 9999)}
            disabled={!regPayment.capReg}
            placeholder={regPayment.capReg ? "40" : "No limit"}
          />
        </Col>
      </Form.Group>

      {/* ADMIN APPROVAL */}
      <EnhancedCheckbox
        id="adminApproval"
        label="Require tournament admin to approve each registration"
        checked={regPayment.adminApproval || false}
        onChange={e => handleregPaymentInfoChange("adminApproval", e.target.checked)}
        disabled={true}
        comingSoon={true}
      />

      {/* CURRENCY TYPE */}
      <Form.Group as={Row} className="mb-3">
        <Col sm="1" />
        <Col sm="3" className="d-flex align-items-center">
          <Form.Label className="m-0">Currency type for registration payments</Form.Label>
        </Col>
        <Col sm="2">
          <Form.Select
            value={regPayment.currencyType || "USD"}
            onChange={e => handleregPaymentInfoChange("currencyType", e.target.value)}
          >
            {Object.values(SUPPORTED_CURRENCIES).map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col sm="6"></Col>
      </Form.Group>

      {/* PAY THROUGH APP */}
      <EnhancedCheckbox
        id="payThroughApp"
        label="Have registrants pay entry fee through SpeedScore (fee for each division specified in 'Divisions' step)"
        checked={regPayment.payThroughApp || false}
        onChange={e => handleregPaymentInfoChange("payThroughApp", e.target.checked)}
      />

      {/* PROCESSING FEES */}
      <Form.Group as={Row} className="mb-3">
        <Col sm="1" />
        <Col sm="2">Processing fees:</Col>
        <Col className="d-flex gap-3 align-items-center">
          <Form.Label className="m-0" htmlFor="processingPercent">
            Percentage of Transaction:
          </Form.Label>
          <div className="d-flex align-items-center">
            <Form.Control
              type="number"
              id="processingPercent"
              step={0.01}
              min={2.9}
              value={regPayment.processingPercent || 2.9}
              onChange={e =>
                handleregPaymentInfoChange("processingPercent", Math.max(2.9, Number(e.target.value)).toFixed(2))
              }
              style={{ width: "80px" }}
            />
            <span className="ms-1">%</span>
          </div>
          <i className="fa fa-solid fa-plus fa-2x" />
          <Form.Label className="m-0" htmlFor="processingFee">
            Flat Transaction Fee:
          </Form.Label>
          <div className="d-flex align-items-center">
            <span className="me-1">$</span>
            <Form.Control
              type="number"
              id="processingFee"
              step={0.01}
              min={0.3}
              value={regPayment.processingFee || 0.3}
              onChange={e =>
                handleregPaymentInfoChange("processingFee", Math.max(0.3, Number(e.target.value)).toFixed(2))
              }
              style={{ width: "80px" }}
            />
          </div>
        </Col>
      </Form.Group>

      {/* ASK SWAG */}
      <EnhancedCheckbox
        id="askSwag"
        label="Ask registrant their size for swag included with registration fee"
        checked={regPayment.askSwag || false}
        onChange={e => handleregPaymentInfoChange("askSwag", e.target.checked)}
      />

      {/* SWAG DETAILS */}
      <Form.Group as={Row} className="align-items-center mb-3">
        <Col sm="2" className="text-end">
          <Form.Label className="m-0" htmlFor="swagName">
            Swag Name:
          </Form.Label>
        </Col>
        <Col sm="2">
          <Form.Control
            type="text"
            id="swagName"
            value={regPayment.swagName || "T-shirt"}
            onChange={e => handleregPaymentInfoChange("swagName", e.target.value)}
          />
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
