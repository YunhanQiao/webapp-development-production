import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { notifyMessage } from "services/toasterServices";
import { fetchCompetitionByID, processPlayerRefund } from "../competitionActions";

const WithdrawModal = ({
  show,
  onHide,
  competitionId,
  playerId,
  playerName,
  tournamentName,
  onWithdrawalComplete,
  hasPaid = false,
  maxAllowedWithdraDate = null,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isRefundEligible, setIsRefundEligible] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (maxAllowedWithdraDate) {
      const currentDate = new Date();
      const withdrawalDeadline = new Date(maxAllowedWithdraDate);

      setIsRefundEligible(currentDate <= withdrawalDeadline);
    } else {
      setIsRefundEligible(true);
    }
  }, [maxAllowedWithdraDate, show]);

  const handleWithdraw = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for withdrawal");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await dispatch(processPlayerRefund(competitionId, playerId, reason));
      if (success) {
        if (onWithdrawalComplete) {
          onWithdrawalComplete();
        }
        onHide();
      } else {
        throw new Error("Failed to process withdrawal");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setError(err.response?.data?.message || err.message || "An error occurred while processing your withdrawal");
      notifyMessage(
        "error",
        "Failed to process withdrawal. Please try again or contact support.",
        5000,
        "colored",
        "top-center",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAfterDeadline = hasPaid && !isRefundEligible;

  const modalTitle = isAfterDeadline
    ? "Withdraw (No Refund)"
    : hasPaid
      ? "Withdraw & Request Refund"
      : "Withdraw from Tournament";

  let withdrawDescription = "";
  if (isAfterDeadline) {
    withdrawDescription =
      "The withdrawal deadline has passed. While you can still withdraw from the tournament, you will not receive a refund according to the tournament policy.";
  } else if (hasPaid) {
    withdrawDescription =
      "Withdrawing will cancel your registration and process a refund to your original payment method. The refund amount may depend on the tournament's refund policy.";
  } else {
    withdrawDescription = "Withdrawing will cancel your registration for this tournament.";
  }

  const buttonText = isAfterDeadline ? "Withdraw without Refund" : hasPaid ? "Withdraw & Request Refund" : "Withdraw";

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to withdraw from <strong>{tournamentName}</strong>?
        </p>

        <Alert variant={isAfterDeadline ? "warning" : "info"}>{withdrawDescription}</Alert>

        {isAfterDeadline && (
          <Alert variant="danger" className="mt-2">
            <strong>No Refund Available:</strong> The withdrawal deadline was{" "}
            {new Date(maxAllowedWithdraDate).toLocaleDateString()}. You can still withdraw, but no refund will be
            processed.
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Reason for withdrawal</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Please provide a reason for your withdrawal"
            disabled={isSubmitting}
          />
        </Form.Group>

        {error && <div className="alert alert-danger">{error}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant={isAfterDeadline ? "warning" : "danger"} onClick={handleWithdraw} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WithdrawModal;
