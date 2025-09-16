import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setError } from "../userSlice";
import { verifyEmailService } from "../userServices";
import { notifyMessage } from "../../../services/toasterServices";

const EmailVerificationPage = () => {
  const [error, setErrorState] = useState(null);
  const hasRun = useRef(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector(state => state.user.isLoading);

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      marginTop: "50px"
    },
    box: {
      border: "2px solid #ccc",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#f8f9fa",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
    },
    text: {
      fontSize: "18px",
      color: "#333",
      margin: "5px"
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
      ":hover": {
        backgroundColor: "#0056b3"
      },
      ":focus": {
        boxShadow: "0 0 0 0.2rem rgba(0, 123, 255, 0.25)"
      }
    }
  };
  useEffect(() => {
    const verifyEmail = async () => {
      dispatch(setLoading(true));
      const res = await verifyEmailService(userId, token);

      if (res.status === 200) {
        //dispatch(setEmailVerified());
        notifyMessage("success", "Email verified successfully", 1000, "colored", "top-center");
        navigate("/login");
      } else {
        notifyMessage("error", "Failed to verify email", 1000, "colored", "top-center");
        setErrorState(true);
      }
      dispatch(setLoading(false));
    };

    if (!hasRun.current) {
      verifyEmail();
      hasRun.current = true;
    }
  }, [dispatch, navigate, token, userId]);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h1 style={{ ...styles.text, color: "red" }}>Email Verification Failed</h1>
          <button onClick={() => navigate("/auth/resend-email")} style={styles.button}>
            Click here to resend email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        {isLoading ? (
          <>
            <p style={styles.text}>We are verifying your email...</p>
            <p style={styles.text}>Please wait...</p>
          </>
        ) : (
          <p style={styles.text}>Email verification process completed.</p>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
