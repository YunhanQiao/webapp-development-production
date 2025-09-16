import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form } from "react-bootstrap";
import { Page, Document, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { notifyMessage } from "services/toasterServices";

const styles = StyleSheet.create({
  page: { flexDirection: "column", padding: 20, fontSize: 12 },
  header: { fontSize: 18, marginBottom: 10, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, marginBottom: 10, textAlign: "center" },
  table: { display: "table", width: "100%", borderCollapse: "collapse", marginTop: 10 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingVertical: 5 },
  tableHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    padding: 5,
    backgroundColor: "#f0f0f0",
  },
  tableCell: { flex: 1, textAlign: "center", fontSize: 10, padding: 5 },
});

const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
};

const TeeSheetPDF = ({ tournament, displayedPlayers, selectedRounds }) => {
  // Get the dates for each round
  const roundDates = {};
  tournament.divisions.forEach(division => {
    division.rounds.forEach((round, index) => {
      roundDates[index + 1] = round.date;
    });
  });

  const findDivisionById = divisionId => {
    return tournament.divisions.find(d => d._id === divisionId);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{tournament.basicInfo.name} - Tee Sheet</Text>

        {Object.entries(roundDates)
          .filter(([roundNum]) => selectedRounds.includes(Number(roundNum)))
          .map(([roundNum, date]) => (
            <Text key={roundNum} style={{ fontSize: 11, marginBottom: 2 }}>
              Round {roundNum} Date: {formatDate(date)}
            </Text>
          ))}

        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: "#e0e0e0" }]}>
            <Text style={styles.tableHeaderCell}>Player Name</Text>
            <Text style={styles.tableHeaderCell}>Division</Text>
            {selectedRounds.map(roundNum => (
              <Text key={roundNum} style={styles.tableHeaderCell}>
                Round {roundNum} Tee Time
              </Text>
            ))}
          </View>
          {displayedPlayers.map((player, index) => {
            const division = findDivisionById(player.division);
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{player.playerName}</Text>
                <Text style={styles.tableCell}>{player.divisionName}</Text>
                {selectedRounds.map(roundNum => {
                  const roundDate = division?.rounds[roundNum - 1]?.date;
                  const assignment = player.roundAssignments?.find(ra => ra.date === roundDate);
                  return (
                    <Text key={roundNum} style={styles.tableCell}>
                      {assignment?.teeTime || "--:--"}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

const ExportTeeSheetDialog = ({ show, onClose, tournament, displayedPlayers }) => {
  const [selectedRounds, setSelectedRounds] = useState([]);

  const availableRounds = useMemo(() => {
    if (!tournament?.divisions) return [];
    const rounds = new Set();
    tournament.divisions.forEach(division => {
      division.rounds?.forEach((round, index) => {
        rounds.add(index + 1);
      });
    });
    return Array.from(rounds).sort((a, b) => a - b);
  }, [tournament]);

  useEffect(() => {
    if (show) {
      setSelectedRounds(availableRounds);
    }
  }, [show, availableRounds]);

  const handleRoundToggle = roundNumber => {
    if (selectedRounds.includes(roundNumber)) {
      setSelectedRounds(selectedRounds.filter(r => r !== roundNumber));
    } else {
      setSelectedRounds([...selectedRounds, roundNumber].sort((a, b) => a - b));
    }
  };

  const handleDownloadCSV = () => {
    if (!displayedPlayers?.length || !selectedRounds?.length) {
      notifyMessage("warning", "No players or rounds selected", 3000, "colored", "top-center");
      return;
    }

    const findDivisionById = divisionId => {
      return tournament.divisions.find(d => d._id === divisionId);
    };

    const roundDates = {};
    tournament.divisions.forEach(division => {
      division.rounds.forEach((round, index) => {
        roundDates[index + 1] = formatDate(round.date);
      });
    });

    const headers = ["Player Name", "Division"];
    selectedRounds.forEach(roundNum => {
      headers.push(`Round ${roundNum} Tee Time`);
    });

    const rows = displayedPlayers.map(player => {
      const division = findDivisionById(player.division);
      const row = [player.playerName, player.divisionName];
      selectedRounds.forEach(roundNum => {
        const roundDate = division?.rounds[roundNum - 1]?.date;
        const assignment = player.roundAssignments?.find(ra => ra.date === roundDate);
        row.push(assignment?.teeTime || "--:--");
      });
      return row;
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tournament.basicInfo.name.replace(/\s+/g, "_")}_TeeSheet.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notifyMessage("success", "CSV downloaded successfully!", 3000, "colored", "top-center");
  };

  const handleCopyLink = () => {
    if (tournament?._id) {
      const link = `${window.location.origin}/tournaments/${tournament._id}/teesheet`;
      navigator.clipboard.writeText(link);
      notifyMessage("success", "Shareable link copied", 3000, "colored", "top-center");
    } else {
      notifyMessage("warning", "No shareable link available", 3000, "colored", "top-center");
    }
  };

  const handlePDFDownload = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!displayedPlayers?.length || !selectedRounds?.length) {
      notifyMessage("warning", "No players or rounds selected", 3000, "colored", "top-center");
      return;
    }
    try {
      console.log("Generating PDF...");
      const pdfDocument = (
        <TeeSheetPDF tournament={tournament} displayedPlayers={displayedPlayers} selectedRounds={selectedRounds} />
      );
      const pdfBlob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tournament.basicInfo.name.replace(/\s+/g, "_")}_TeeSheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      notifyMessage("success", "PDF downloaded successfully!", 3000, "colored", "top-center");
    } catch (error) {
      console.error("PDF generation error:", error);
      notifyMessage("danger", "Failed to generate PDF", 3000, "colored", "top-center");
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Export Tee Times</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Day's to Include in Export:</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {availableRounds.map(roundNum => (
                <Form.Check
                  key={roundNum}
                  type="checkbox"
                  id={`round-${roundNum}`}
                  label={`Day ${roundNum}`}
                  checked={selectedRounds.includes(roundNum)}
                  onChange={() => handleRoundToggle(roundNum)}
                  inline
                />
              ))}
            </div>
          </Form.Group>
          {/* <Form.Group className='mb-3'>
            <Form.Label>Shareable Link:</Form.Label>
            <div className='d-flex'>
              <Form.Control
                type='text'
                value={tournament?._id ? `${window.location.origin}/competitions/${tournament._id}/teesheet` : ""}
                readOnly
              />
              <button variant='outline-secondary' onClick={handleCopyLink}>
                📋
              </button>
            </div>
          </Form.Group> */}

          <div className="d-grid gap-2">
            <button variant="primary" onClick={handleDownloadCSV} disabled={!selectedRounds.length}>
              Download CSV of tee sheet
            </button>
            <button variant="primary" onClick={handlePDFDownload} disabled={!selectedRounds.length}>
              Download PDF of tee sheet
            </button>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <button variant="secondary" onClick={onClose}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ExportTeeSheetDialog;
