import React from "react";
import { Modal, Table } from "react-bootstrap";
import "flag-icon-css/css/flag-icons.min.css";

const DEFAULT_PLAYER_IMAGE = "../../../images/DefaultProfilePic.jpg";

const PlayersListModal = ({ show, onHide, players, tournamentName }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          List of {players.length} Players Registered for {tournamentName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Division</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={index}>
                <td>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      src={player.profilePic || DEFAULT_PLAYER_IMAGE}
                      alt={player.playerName}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        marginRight: "10px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <div>
                        <strong>{player.playerName}</strong>
                        {player.homeCountry && (
                          <span
                            className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                            title={player.homeCountry}
                            style={{ marginLeft: "8px" }}
                          />
                        )}
                      </div>
                      <div>{[player.homeTown, player.homeState, player.homeCountry].filter(Boolean).join(", ")}</div>
                    </div>
                  </div>
                </td>
                <td>{player.divisionName || player.division || "Open"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <button className="mode-page-btn action-dialog action-button" onClick={onHide}>
          Dismiss
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default PlayersListModal;
