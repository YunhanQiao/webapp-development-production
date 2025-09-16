import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import "../../styles/features/supportTicket/supportTicketStyles.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { createTicket } from "./supportTicketServices"; // Adjust the import path as necessary

const MySwal = withReactContent(Swal);

const SupportButton = () => {
  const [formData, setFormData] = useState({ name: "", email: "", issue: "" });

  const handleClick = () => {
    MySwal.fire({
      title: "Submit a Support Ticket",
      allowOutsideClick: false,
      // width: "40%",
      html: (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            id="support-name"
            placeholder="Name"
            className="swal2-input"
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="email"
            id="support-email"
            placeholder="Email"
            className="swal2-input"
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
          <textarea
            placeholder="Describe your issue..."
            className="swal2-textarea"
            id="support-issue"
            onChange={e => setFormData(prev => ({ ...prev, issue: e.target.value }))}
          />
        </div>
      ),
      confirmButtonText: "Submit",
      preConfirm: async () => {
        Swal.showLoading();

        // const { name, email, issue } = formData;
        const name = document.getElementById("support-name").value.trim();
        const email = document.getElementById("support-email").value.trim();
        const issue = document.getElementById("support-issue").value.trim();

        if (!name || !email || !issue) {
          Swal.showValidationMessage("Please fill out all fields");
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage("Please enter a valid email address");
          return false;
        }
        if (issue.trim().length < 5) {
          Swal.showValidationMessage("Issue must be at least 5 characters");
          return false;
        }
        // return formData;
        try {
          const response = await createTicket({ name, email, issue });
          if (response.status === 201) {
            return response.data;
          } else {
            Swal.showValidationMessage("Failed to submit ticket. Please try again later.");
            // setFormData({ name: "", email: "", issue: "" });
            return false;
          }
        } catch (error) {
          Swal.showValidationMessage("Network error. Please try again.");
          // setFormData({ name: "", email: "", issue: "" });
          return false;
        }
      },
      showCancelButton: true,
    }).then(result => {
      if (result.isConfirmed && result.value) {
        // ✅ Call your API here to submit the ticket
        console.log("Support ticket submitted:", result.value);
        Swal.fire("Submitted!", "Your support ticket was sent.", "success");
        setFormData({ name: "", email: "", issue: "" });
      }
    });
  };

  return (
    <button
      className="support-ticket-button"
      onClick={handleClick}
      type="button"
      data-bs-toggle="tooltip"
      title="Need help? Submit a support ticket"
    >
      <FontAwesomeIcon icon={faCircleInfo} size="lg" />
    </button>
  );
};

export default SupportButton;
