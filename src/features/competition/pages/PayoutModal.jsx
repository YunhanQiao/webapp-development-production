import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { processPayout } from "../competitionActions";
import { formatCurrency, SUPPORTED_CURRENCIES } from "../utils/currencyUtils";

const TournamentPayout = ({ show, onClose, tournament, isProcessing }) => {
  const dispatch = useDispatch();
  const [processingPayout, setProcessingPayout] = useState(false);

  if (!tournament) return null;

  // GET CURRENCY FROM TOURNAMENT
  const currencyCode = tournament?.regPaymentInfo?.currencyType || "USD";
  const currency = SUPPORTED_CURRENCIES[currencyCode];

  const handleConfirmPayout = async () => {
    setProcessingPayout(true);
    try {
      const success = await dispatch(processPayout(tournament._id));
      if (success) {
        onClose();
      }
    } finally {
      setProcessingPayout(false);
    }
  };

  const totalAmount = tournament.paymentTracking.totalAmountCollected || 0;
  const processingFees = tournament.paymentTracking.totalProcessingFeesCollected || 0;
  const flatFees = tournament.paymentTracking.totalFlatFeesCollected || 0;
  const platformFee = tournament?.paymentTracking?.platformFee || 0;
  const platformFeeType = tournament?.paymentTracking?.platformFeeType || "percentage";

  let platformFeeAmount = 0;
  if (platformFeeType === "percentage") {
    platformFeeAmount = (totalAmount * platformFee) / 100;
  } else {
    platformFeeAmount = platformFee;
  }

  const payoutAmount = totalAmount - processingFees - flatFees - platformFeeAmount;

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Process Tournament Payout</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          You are about to process the payout for <strong>{tournament.basicInfo?.name}</strong>.
        </p>

        <div className="mb-3 p-3 border rounded">
          <h5>Payout Details ({currency?.name || "USD"})</h5>
          <div className="d-flex justify-content-between mb-2">
            <span>Total Collected:</span>
            <strong>{formatCurrency(totalAmount, currencyCode)}</strong>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Processing Fees (Percentage-based):</span>
            <strong>-{formatCurrency(processingFees, currencyCode)}</strong>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Transaction Fees (Flat):</span>
            <strong>-{formatCurrency(flatFees, currencyCode)}</strong>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>
              Platform Fee (
              {platformFeeType === "percentage" ? `${platformFee}%` : formatCurrency(platformFee, currencyCode)}):
            </span>
            <strong>-{formatCurrency(platformFeeAmount, currencyCode)}</strong>
          </div>

          <div className="d-flex justify-content-between border-top pt-2 mt-2">
            <span>Final Payout Amount:</span>
            <strong className="text-success">{formatCurrency(payoutAmount, currencyCode)}</strong>
          </div>
        </div>

        <p>This amount will be transferred to the tournament director's Stripe account.</p>

        <div className="alert alert-info">
          <small>
            Note: Payout processing can take 1-3 business days to complete, depending on the receiving bank and
            currency.
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={processingPayout}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirmPayout} disabled={processingPayout}>
          {processingPayout ? "Processing..." : "Confirm Payout"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TournamentPayout;
