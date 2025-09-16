import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../userSlice";
import { verifyPasswordService } from "../userServices";
import { notifyMessage } from "../../../services/toasterServices";
import Navbar from "../../shared/Navbar/Navbar";
import { calculatePasswordStrength } from "../../../services/userAuthenticationServices"; // Import the password strength function
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import FontAwesome
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"; // Import specific icons

const VerifyPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passShow, setPassShow] = useState(false); // State for toggling password visibility
  const [confirmPassShow, setConfirmPassShow] = useState(false); // State for toggling confirm password visibility
  const [error, setErrorState] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const token = searchParams.get("token");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.user.isLoading);

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      marginTop: "50px",
    },
    box: {
      border: "2px solid #ccc",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#f8f9fa",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      maxWidth: "400px",
      width: "100%",
    },
    text: {
      fontSize: "18px",
      color: "#333",
      margin: "5px",
    },
    inputWrapper: {
      position: "relative",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "10px",
      margin: "10px 0",
      borderRadius: "5px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
      paddingRight: "40px", // Add padding to make room for the icon
    },
    icon: {
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
    },
    button: {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#007bff",
      border: "none",
      borderRadius: "5px",
      padding: "10px 20px",
      cursor: "pointer",
      transition: "background-color 0.2s",
      margin: "10px 0",
      outline: "none",
    },
    passwordStrengthBar: {
      height: "5px",
      backgroundColor: "#ccc",
      borderRadius: "5px",
      marginTop: "10px",
    },
    passwordStrengthIndicator: {
      height: "5px",
      borderRadius: "5px",
    },
  };

  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notifyMessage("error", "Passwords do not match", 1000, "colored", "top-center");
      return;
    } else if (!passwordRegex.test(password)) {
      notifyMessage(
        "error",
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number",
        1000,
        "colored",
        "top-center"
      );
      return;
    }

    dispatch(setLoading(true));
    const res = await verifyPasswordService(token, password, confirmPassword);
    if (res.status === 200) {
      notifyMessage("success", "Password reset successfully", 1000, "colored", "top-center");
      navigate("/login");
    } else {
      notifyMessage("error", "Failed to reset password", 1000, "colored", "top-center");
      setErrorState(true);
    }

    dispatch(setLoading(false));
  };

  const togglePasswordVisibility = () => {
    setPassShow(!passShow);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPassShow(!confirmPassShow);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  return (
    <>
      <Navbar />
      <br />
      <br />
      <div style={styles.container}>
        <div style={styles.box}>
        <h1 className='mode-page-header'>Password Reset</h1>
          {error && <p style={{ ...styles.text, color: "red" }}>Password Reset Failed</p>}
          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <input
                id="acctPassword"
                type={passShow ? "text" : "password"} // Toggle between text and password
                className="form-control centered"
                aria-describedby="acctPasswordDescr"
                style={styles.input}
                placeholder="Enter new password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <FontAwesomeIcon
                icon={passShow ? faEyeSlash : faEye}
                onClick={togglePasswordVisibility}
                style={styles.icon}
              />
            </div>
            <div style={styles.passwordStrengthBar}>
              <div
                style={{
                  ...styles.passwordStrengthIndicator,
                  width: `${passwordStrength * 20}%`, // Assuming the strength is a value from 0 to 5
                  backgroundColor:
                    passwordStrength <= 1
                      ? "red"
                      : passwordStrength <= 3
                      ? "orange"
                      : "green",
                }}
              ></div>
            </div>
            <p>Password strength: {passwordStrength}/5</p>
            <div style={styles.inputWrapper}>
              <input
                type={confirmPassShow ? "text" : "password"} // Toggle between text and password
                className="form-control centered"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
              />
              <FontAwesomeIcon
                icon={confirmPassShow ? faEyeSlash : faEye}
                onClick={toggleConfirmPasswordVisibility}
                style={styles.icon}
              />
            </div>
            {/* <button type="submit" style={styles.button} disabled={isLoading}>
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button> */}
            <button type='submit' id='submitBtn' className='btn btn-primary fm-primary-btn'  style={{ fontSize: '1.4em', padding: '5px 10px' }} disabled={isLoading}>
            <span id='submitBtnIcon' className='fas fa-sign-in-alt' aria-hidden='true'></span>
            &nbsp; {isLoading ? "Resetting Password.." : "Reset Password"}
          </button>

            <div className="d-flex justify-content-center mt-2">
            <button
              id='resetPasswordBtn'
              className='nav-link btn btn-link text-center'
              onClick={() => navigate("/login")}>
              <u>Back to Login</u>
            </button>
          </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default VerifyPasswordPage;
