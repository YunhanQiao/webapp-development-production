import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import "../../../styles/features/competition/moreInfoModal.css";
import WithdrawModal from "./WithdrawModal";
import { useSelector } from "react-redux";

const RegistrationInfoModal = ({ show, onHide, tournament, userRegistration, onWithdrawComplete }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [synchronizedRoundAssignments, setSynchronizedRoundAssignments] = useState([]);
  const user = useSelector(state => state.user.user);

  const findDivisionById = useCallback(
    divisionId => {
      if (!tournament || !tournament.divisions) return null;
      return tournament.divisions.find(d => d._id === divisionId);
    },
    [tournament],
  );

  useEffect(() => {
    if (show && tournament) {
      const playerAssignment = tournament.teeSheet?.playerAssignments?.find(
        pa => pa.playerId.toString() === user._id.toString(),
      );

      if (playerAssignment && playerAssignment.roundAssignments) {
        const formattedAssignments = playerAssignment.roundAssignments.map((round, index) => ({
          date: round.date,
          teeTime: round.teeTime || "Not assigned yet",
          status: "Scheduled",
          roundNumber: index + 1,
        }));

        setSynchronizedRoundAssignments(formattedAssignments);
      } else if (userRegistration) {
        const playerDivision = findDivisionById(userRegistration.division);

        if (playerDivision && playerDivision.rounds && playerDivision.rounds.length > 0) {
          const divisionRounds = playerDivision.rounds;
          const currentAssignments = userRegistration.roundAssignments || [];

          const assignmentsByDate = {};
          currentAssignments.forEach(assignment => {
            if (assignment && assignment.date) {
              assignmentsByDate[assignment.date] = assignment;
            }
          });

          const synced = divisionRounds.map((round, index) => {
            if (assignmentsByDate[round.date]) {
              return {
                ...assignmentsByDate[round.date],
                roundNumber: index + 1,
              };
            }

            return {
              date: round.date,
              teeTime: "Not assigned yet",
              status: "scheduled",
              roundNumber: index + 1,
            };
          });

          setSynchronizedRoundAssignments(synced);
        } else {
          setSynchronizedRoundAssignments(userRegistration.roundAssignments || []);
        }
      }
    }
  }, [show, tournament, userRegistration, user._id, findDivisionById]);

  useEffect(() => {
    if (show && tournament?.regPaymentInfo?.maxAllowedWithdraDate) {
      console.log("Tournament data:", {
        id: tournament._id,
        name: tournament.basicInfo?.name,
        maxAllowedWithdraDate: tournament.regPaymentInfo.maxAllowedWithdraDate,
        currentDate: new Date().toISOString(),
        isAfterDeadline: new Date() > new Date(tournament.regPaymentInfo.maxAllowedWithdraDate),
      });
    }
  }, [show, tournament]);

  if (!tournament || !userRegistration) return null;

  const { basicInfo } = tournament || {};

  // Get tournament year from start date
  const tournamentYear = basicInfo?.startDate ? new Date(basicInfo.startDate).getFullYear() : "";
  const fullTournamentName = tournamentYear ? `${tournamentYear} ${basicInfo?.name}` : basicInfo?.name;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const playerDivision = findDivisionById(userRegistration.division);
  const divisionName = playerDivision?.name || "Unknown Division";

  // Get registration fee from division and payment info
  const registrationFee = playerDivision?.entryFee || 0;
  const payThroughApp = tournament?.regPaymentInfo?.payThroughApp;

  const isTournamentStarted = () => {
    if (!basicInfo?.startDate) return false;
    const tournamentStartDate = new Date(basicInfo.startDate);
    const today = new Date();
    return today >= tournamentStartDate;
  };

  const canWithdraw = !isTournamentStarted() && userRegistration.status !== "withdrawn";

  const hasPaid = Boolean(userRegistration.totalFeesPaid);

  const isPastRefundDeadline = () => {
    if (!tournament?.regPaymentInfo?.maxAllowedWithdraDate) return false;
    return new Date() > new Date(tournament.regPaymentInfo.maxAllowedWithdraDate);
  };

  const getWithdrawButtonText = () => {
    if (hasPaid && isPastRefundDeadline()) {
      return "Withdraw (No Refund)";
    } else if (hasPaid) {
      return "Withdraw & Request Refund";
    } else {
      return "Withdraw";
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header className="d-flex justify-content-between align-items-center">
          <Modal.Title>Your Registration: {fullTournamentName}</Modal.Title>
          <Button
            variant="link"
            onClick={onHide}
            className="p-0 border-0"
            style={{ fontSize: "1.2rem", color: "#6c757d" }}
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Modal.Header>
        <Modal.Body>
          <div className="comp-label-info-container">
            <div className="label">Name:</div>
            <div className="info d-flex align-items-center">
              <img
                src={user?.personalInfo?.profilePic || "/images/DefaultProfilePic.jpg"}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginRight: "12px",
                  border: "2px solid #dee2e6",
                }}
                onError={e => {
                  e.target.src = "/images/DefaultProfilePic.jpg";
                }}
              />
              {userRegistration.playerName}
            </div>
          </div>

          <div className="comp-label-info-container">
            <div className="label">Status:</div>
            <div className="info">
              {userRegistration.status === "withdrawn" ? (
                <span className="text-danger" style={{ fontWeight: "bold" }}>
                  Withdrawn
                  {userRegistration.withdrawalDate && (
                    <span className="ms-2" style={{ fontSize: "0.9em" }}>
                      (on {dateFormatter.format(new Date(userRegistration.withdrawalDate))})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-success" style={{ fontWeight: "bold" }}>
                  Registered
                </span>
              )}
            </div>
          </div>

          <div className="comp-label-info-container">
            <div className="label">Division:</div>
            <div className="info">{divisionName}</div>
          </div>

          {userRegistration.swagSize && (
            <div className="comp-label-info-container">
              <div className="label">{tournament.regPaymentInfo.swagName || "Shirt Size"}:</div>
              <div className="info">{userRegistration.swagSize}</div>
            </div>
          )}

          <div className="comp-label-info-container">
            <div className="label">Golf Score:</div>
            <div className="info">{userRegistration.avgGolfScore}</div>
          </div>

          <div className="comp-label-info-container">
            <div className="label">5K Time:</div>
            <div className="info">{userRegistration.fiveKRunningTime} minutes</div>
          </div>

          <div className="comp-label-info-container">
            <div className="label">Registration Fee:</div>
            <div className="info">
              {userRegistration.totalFeesPaid
                ? `$${userRegistration.totalFeesPaid.toFixed(2)}`
                : registrationFee > 0
                  ? payThroughApp
                    ? `$${registrationFee.toFixed(2)}`
                    : `$${registrationFee.toFixed(2)} (not collected through SpeedScore)`
                  : "$N/A"}
            </div>
          </div>

          {userRegistration.status === "withdrawn" && userRegistration.refundDetails && (
            <>
              <div className="comp-label-info-container">
                <div className="label">Withdrawal Date:</div>
                <div className="info">
                  {userRegistration.withdrawalDate
                    ? dateFormatter.format(new Date(userRegistration.withdrawalDate))
                    : "N/A"}
                </div>
              </div>
              {userRegistration.refundDetails.amount && (
                <div className="comp-label-info-container">
                  <div className="label">Refund Amount:</div>
                  <div className="info">
                    $
                    {userRegistration.refundDetails.amount
                      ? (userRegistration.refundDetails.amount / 100).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
              )}
            </>
          )}

          {userRegistration.billingEmail && (
            <div className="comp-label-info-container">
              <div className="label">Billing Email:</div>
              <div className="info">{userRegistration.billingEmail}</div>
            </div>
          )}

          {userRegistration.status === "withdrawn" ? (
            <div className="comp-label-info-container">
              <div className="label">Tee Times:</div>
              <div className="info">
                <div className="alert alert-secondary" style={{ marginBottom: 0 }}>
                  <i className="bi bi-info-circle me-2"></i>
                  You have withdrawn from this tournament. Your tee times have been removed.
                </div>
              </div>
            </div>
          ) : (
            <div className="comp-label-info-container">
              <div className="label">Tee Times:</div>
              <div className="info">
                {synchronizedRoundAssignments && synchronizedRoundAssignments.length > 0 ? (
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {synchronizedRoundAssignments.map((round, index) => (
                        <tr key={index}>
                          <td>{dateFormatter.format(new Date(round.date))}</td>
                          <td>{round.teeTime || "Not assigned yet"}</td>
                          <td>{round.status?.charAt(0).toUpperCase() + round.status?.slice(1) || "Scheduled"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  "No tee times assigned yet"
                )}
              </div>
            </div>
          )}

          {userRegistration.scoreCards && userRegistration.scoreCards.length > 0 && (
            <div className="comp-label-info-container">
              <div className="label">Scores:</div>
              <div className="info">
                <Table bordered>
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Score</th>
                      <th>Time</th>
                      <th>Speedgolf Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRegistration.scoreCards.map((scoreCard, index) => {
                      let roundNumber = index + 1;
                      if (playerDivision && playerDivision.rounds) {
                        const roundIndex = playerDivision.rounds.findIndex(r => r._id === scoreCard.roundId);
                        if (roundIndex !== -1) {
                          roundNumber = roundIndex + 1;
                        }
                      }

                      return (
                        <tr key={index}>
                          <td>Round {roundNumber}</td>
                          <td>{scoreCard.totalScore}</td>
                          <td>{scoreCard.totalTime}</td>
                          <td>{scoreCard.speedGolfScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          {canWithdraw && (
            <Button className="btn-danger me-auto" onClick={() => setShowWithdrawModal(true)}>
              {getWithdrawButtonText()}
            </Button>
          )}
          <Button className="mode-page-btn action-dialog action-button custom-ok-button" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <WithdrawModal
        show={showWithdrawModal}
        onHide={() => setShowWithdrawModal(false)}
        competitionId={tournament?._id}
        playerId={userRegistration?.userId}
        playerName={userRegistration?.playerName}
        tournamentName={basicInfo?.name}
        hasPaid={hasPaid}
        maxAllowedWithdraDate={tournament?.regPaymentInfo?.maxAllowedWithdraDate}
        onWithdrawalComplete={() => {
          setShowWithdrawModal(false);
          if (onWithdrawComplete) onWithdrawComplete();
        }}
      />
    </>
  );
};

export default RegistrationInfoModal;
