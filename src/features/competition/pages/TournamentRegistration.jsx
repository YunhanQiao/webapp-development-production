import React, { useState, useEffect } from "react";
import { Modal, Form, Row, Col } from "react-bootstrap";
import ErrorMessage from "features/shared/BaseFormComponents/ErrorMessage";
import isEmpty from "lodash/isEmpty";
import useRegistration from "../hooks/useRegistration";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useDispatch } from "react-redux"; // Add this import
//import { fetchCurrentUser } from "../../../user/userActions";  // Add this import
import { fetchCurrentUser } from "features/user/userActions";
import { formatCurrency, SUPPORTED_CURRENCIES } from "../utils/currencyUtils";
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentStep = ({
  register,
  tournament,
  total,
  registrationFee,
  processingPercent,
  percentageFee,
  flatTransactionFee,
  cardError,
}) => {
  const currencyCode = tournament?.regPaymentInfo?.currencyType || "USD";
  const currency = SUPPORTED_CURRENCIES[currencyCode];

  return (
    <div className="payment-step">
      <Modal.Header closeButton>
        <Modal.Title>Register: {tournament?.basicInfo?.name}: Check Out</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4 amount-breakdown">
          <h5>Amount Due:</h5>
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between">
              <span>Registration Fee:</span>
              <span>{formatCurrency(registrationFee, currencyCode)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Processing Fee ({processingPercent}%):</span>
              <span>{formatCurrency(percentageFee, currencyCode)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Flat Transaction Fee:</span>
              <span>{formatCurrency(flatTransactionFee, currencyCode)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Total Due:</span>
              <span>{formatCurrency(total, currencyCode)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h5>Payment Method:</h5>
          <div className="border rounded p-3">
            <Form.Group>
              <Form.Label>Billing Email</Form.Label>
              <Form.Control type="email" {...register("billingEmail")} placeholder="Email" />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Card Information</Form.Label>
              <div className="stripe-element">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": {
                          color: "#aab7c4",
                        },
                      },
                      invalid: {
                        color: "#9e2146",
                      },
                    },
                  }}
                />
              </div>
              {cardError && <div className="text-danger mt-2">{cardError}</div>}
            </Form.Group>
          </div>
        </div>
      </Modal.Body>
    </div>
  );
};

const RegistrationFormBase = ({ show, onClose, onRegistrationSuccess, tournament, user, divisions, stripeProps }) => {
  const [step, setStep] = useState(1);
  const payThroughApp = tournament?.regPaymentInfo?.payThroughApp;
  const dispatch = useDispatch(); // Add this line to get dispatch function

  // Add the useEffect hook here
  useEffect(() => {
    // If user ID is missing but there's a JWT token
    if (!user?._id && localStorage.getItem("jwtToken")) {
      console.log("User ID missing but JWT token found. Fetching current user...");
      // Fetch the user data
      dispatch(fetchCurrentUser());
    }
  }, [user?._id, dispatch]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
    divisionsList,
    isRegistering,
    shouldShowSizes,
    onSubmit,
    formatDate,
    formatGender,
    isAlreadyRegistered,
    showValidation,
    setShowValidation,
    cardError,
    setCardError,
  } = useRegistration({
    show,
    onClose: onRegistrationSuccess || onClose,
    tournament,
    stripeProps,
  });

  // Early return if user data isn't loaded yet
  if (!user?.personalInfo || !divisions) {
    console.log("User or divisions data not loaded yet");
    return null;
  }

  const selectedDivision = watch("division");
  const division = divisionsList.find(d => d._id === selectedDivision);
  const registrationFee = division?.entryFee || 0;
  const processingPercent = tournament?.regPaymentInfo?.processingPercent || 0;
  const flatTransactionFee = tournament?.regPaymentInfo?.processingFee || 0;
  const percentageFee = (registrationFee * processingPercent) / 100;
  const total = registrationFee + percentageFee + flatTransactionFee;

  const handleNextStep = async e => {
    e.preventDefault();
    setShowValidation(true);
    const step1Fields = ["division", "swagSize", "avgGolfScore", "fiveKRunningTime"];
    const isValid = await trigger(step1Fields);

    if (isValid) {
      if (payThroughApp) {
        setStep(2);
        setCardError("");
      } else {
        handleSubmit(data => onSubmit(data, 1))();
      }
    }
  };

  const handleFormSubmit = async data => {
    if (step === 2 && payThroughApp) {
      const { stripe, elements } = stripeProps || {};
      if (!stripe || !elements) {
        setCardError("Payment system has not been initialized");
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setCardError("Card element not found");
        return;
      }

      try {
        const { error } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

        if (error) {
          setCardError(error.message || "Please enter valid card information");
          return;
        }
      } catch (e) {
        setCardError("Please enter valid card information");
        return;
      }
    }

    return onSubmit(data, step);
  };

  const renderDivisionCard = division => {
    const currencyCode = tournament?.regPaymentInfo?.currencyType || "USD";
    const numHoles = division.rounds?.[0]?.numHoles || "";
    const isSelected = watch("division") === division._id;
    return (
      <div
        key={division._id}
        className={`border rounded p-3 cursor-pointer ${isSelected ? "bg-primary text-white" : ""}`}
        style={{ width: "200px", cursor: "pointer" }}
        onClick={() => !isAlreadyRegistered && setValue("division", division._id)}
      >
        <div className="fw-bold">{`${numHoles}-Hole ${division.name}`}</div>
        <div>Age: {division.minAge ? `${division.minAge}-${division.maxAge}` : "All ages"}</div>
        <div>Entry Fee: {formatCurrency(division.entryFee, currencyCode)}</div>
      </div>
    );
  };

  const renderPersonalInfo = () => (
    <>
      <Modal.Header closeButton>
        <Modal.Title>Register: {tournament?.basicInfo?.name}: Personal Info</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {showValidation && !isEmpty(errors) && (
          <div className="alert alert-danger">
            {Object.entries(errors).map(([key, error]) => (
              <ErrorMessage key={key} id={key}>
                {error.message}
              </ErrorMessage>
            ))}
          </div>
        )}
        <Row className="mb-4">
          <Col sm="auto" className="pe-4">
            <div className="fw-bold mb-2">Registrant:</div>
            {user.personalInfo.profilePic && (
              <img
                src={user.personalInfo.profilePic}
                alt="Profile"
                className="rounded"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            )}
          </Col>
          <Col>
            <div>
              Name: {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
            </div>
            <div>Gender: {formatGender(user?.personalInfo?.parGender)}</div>
            <div>Birthdate: {formatDate(user?.personalInfo?.birthdate)}</div>
            <div>Hometown: {user?.personalInfo?.hometown}</div>
            <div>Country: {user?.personalInfo?.homeCountry}</div>
            <input type="hidden" {...register("homeCountry")} value={user?.personalInfo?.homeCountry || ""} />
          </Col>
        </Row>
        <div className="mb-4">
          <div className="fw-bold mb-2">Division to Enter:</div>
          <div className="d-flex gap-3 flex-wrap division-cards-container">
            {divisionsList.length > 0
              ? divisionsList.map(renderDivisionCard)
              : "No divisions to display. Not eligible: Gender or Age"}
          </div>
        </div>
        {shouldShowSizes && (
          <div className="mb-4">
            <div className="fw-bold mb-2">{tournament.regPaymentInfo.swagName || "Shirt Size"} (Unisex):</div>
            <div className="d-flex gap-2">
              {tournament.regPaymentInfo.swagSizes.map(size => (
                <div
                  key={size}
                  className={`border rounded px-3 py-2 cursor-pointer ${
                    watch("swagSize") === size ? "bg-primary text-white" : ""
                  }`}
                  onClick={() => !isAlreadyRegistered && setValue("swagSize", size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
        )}
        <Row className="mb-4">
          <Col sm={6}>
            <Form.Group>
              <Form.Label className="fw-bold">Avg. 18-hole golf score:</Form.Label>
              <Form.Control type="number" min="0" {...register("avgGolfScore")} disabled={isAlreadyRegistered} />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label className="fw-bold">5k running time (minutes):</Form.Label>
              <Form.Control type="number" min="0" {...register("fiveKRunningTime")} disabled={isAlreadyRegistered} />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
    </>
  );

  return (
    <Modal show={show} onHide={onClose} size="lg" className="registration-modal">
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        {step === 1
          ? renderPersonalInfo()
          : payThroughApp && (
              <PaymentStep
                register={register}
                tournament={tournament}
                total={total}
                registrationFee={registrationFee}
                processingPercent={processingPercent}
                percentageFee={percentageFee}
                flatTransactionFee={flatTransactionFee}
                cardError={cardError}
              />
            )}
        <Modal.Footer className="d-flex justify-content-between border-0 px-3 pb-3">
          {step === 2 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={isRegistering}>
              ← Previous
            </button>
          )}
          <div>
            <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isRegistering}>
              Cancel
            </button>
            {isAlreadyRegistered ? (
              <button type="button" className="btn btn-primary" disabled={true}>
                Registered
              </button>
            ) : (
              <button
                type={step === 2 ? "submit" : "button"}
                className="btn btn-primary"
                onClick={step === 1 ? handleNextStep : undefined}
                disabled={!selectedDivision || isRegistering}
              >
                {isRegistering ? "Processing..." : step === 1 ? (payThroughApp ? "Next →" : "Register") : "Purchase"}
              </button>
            )}
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const RegistrationFormWithStripe = props => {
  const stripe = useStripe();
  const elements = useElements();

  return <RegistrationFormBase {...props} stripeProps={{ stripe, elements }} />;
};

const TournamentRegistration = props => {
  const payThroughApp = props.tournament?.regPaymentInfo?.payThroughApp;
  if (payThroughApp) {
    return (
      <Elements stripe={stripePromise}>
        <RegistrationFormWithStripe {...props} />
      </Elements>
    );
  }
  return <RegistrationFormBase {...props} />;
};

export default TournamentRegistration;
