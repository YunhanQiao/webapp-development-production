// src/features/landing/LoginPage.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../shared/Navbar/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "../userActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import sslogos from "../../../images/Speedgolf_Technology-FF-01.png";
import { emailValidator, passwordValidator } from "../../../services/userAuthenticationServices";
import { fakerUserGenerator } from "../userServices";
import "../../../styles/features/user/landing.styles.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [passShow, setPassShow] = useState(false);
  const dispatch = useDispatch();
  const userAuthenticated = useSelector(state => state.user.authenticated);
  const navigate = useNavigate();

  const emailChangeHandler = event => {
    setEmail(event.target.value);
  };

  const passwordChangeHandler = event => {
    setPassword(event.target.value);
  };

  // useEffect(() => {
  //   if (userAuthenticated) navigate("/feed");
  // }, [userAuthenticated]);
  // With this modified version:
  // With this modified version:
  useEffect(() => {
    if (userAuthenticated) {
      // Parse the redirect URL from query parameters
      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get("redirect");

      // Navigate to the redirect URL if available, otherwise go to feed
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate("/feed");
      }
    }
  }, [userAuthenticated, navigate]);

  const submitHandler = async event => {
    event.preventDefault();
    let emailValid = emailValidator(email);
    let passwordValid = passwordValidator(password);

    if (emailValid && passwordValid) {
      dispatch(loginUserAction({ email, password }));
    } else {
      setPasswordError(!passwordValid);
      setEmailError(!emailValid);
    }

    setEmail("");
    setPassword("");
  };

  return (
    <>
      <Navbar />
      <div className="ln-landing-page container mt-5">
        <main className="row">
          <div className="col-md-6 mb-4 text-left mt-4 content d-none d-md-block">
            <section className="ln-intro">
              <h1>Welcome to the Future of Speedgolf</h1>
              <p>
                SpeedScore is the world's first and only app ecosystem for speedgolf. It brings together an
                international community of folks who are passionate about playing, tracking, competing in, analyzing,
                following and discussing a modern version of golf where strokes and minutes count equally.
              </p>
            </section>
            <section className="ln-features">
              <p>In the SpeedScore web app, you can:</p>
              <ul>
                <li>Connect with players and followers of speedgolf from around the world.</li>
                <li>Discover speedgolf-friendly courses in SpeedScore's speedgolf-specific course database.</li>
                <li>
                  Create and utilize detailed speedgolf maps of golf courses that use running paths and elevation
                  profiles to compute principled hole-by-hole time pars.
                </li>
                <li>Log and analyze speedgolf rounds using SpeedScore's exclusive speedgolf-specific course data.</li>
                <li>Discover and register for speedgolf tournaments around the world.</li>
                <li>Create and participate in speedgolf leagues, both in person and virtual.</li>
                <li>
                  Challenge speedgolfers to matches that can be played at different times and on different courses.
                </li>
              </ul>
            </section>
            <section className="cta">
              <h3 className="ln-cta-heading">Get Started Today! Speedgolf Baby, let's go!</h3>
              <h6>
                <a target="blank" href={`${process.env.REACT_APP_TUTORIAL_VIDEOS_URL}`}>
                  Need help? Access video tutorials - (Opens new window)
                </a>
              </h6>
              <div className="ln-image-row d-flex align-items-center">
                <img src={sslogos} alt="speedScore Logo" className="me-2" style={{ height: "300px", width: "500px" }} />
              </div>
            </section>
          </div>
          <div className="col-md-6 d-flex justify-content-center align-items-start login-page-wrapper">
            <div className="ln-login-page">
              <h2 className="text-center">Log In</h2>
              <p
                id="errorBox"
                className={`alert alert-danger ln-centered ${passwordError || emailError || authError ? "" : "hidden"}`}
              >
                <a id="emailError" href="#email" className={`alert-link ${emailError ? "" : "hidden"}`}>
                  Enter a valid email address
                  <br />
                </a>
                <a id="passwordError" href="#password" className={`alert-link ${passwordError ? "" : "hidden"}`}>
                  Enter a valid password
                </a>
                <a id="authError" href="#email" className={`alert-link ${authError ? "" : "hidden"}`}>
                  No user account exists with email and password entered. Create an account or re-enter email and/or
                  password
                </a>
              </p>
              <form id="loginForm" className="ln-centered" noValidate onSubmit={submitHandler}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email:
                    <br />
                    <input
                      id="email"
                      type="email"
                      name="username"
                      className="form-control centered"
                      aria-describedby="loginIdDescr"
                      required
                      value={email}
                      onChange={emailChangeHandler}
                      style={{ paddingRight: "40px" }}
                    />
                  </label>
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password:
                    <br />
                    <div className="ln-password-field-wrapper">
                      <input
                        id="password"
                        type={!passShow ? "password" : "text"}
                        name="password"
                        className="form-control centered"
                        pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$"
                        aria-describedby="passwordDescr"
                        required
                        value={password}
                        onChange={passwordChangeHandler}
                        style={{ paddingRight: "40px" }}
                      />
                      <div
                        className="ln-show-hide-pass"
                        style={{
                          backgroundColor: "transparent",
                          position: "absolute",
                          top: "50%",
                          right: "10px",
                          transform: "translateY(-50%)",
                        }}
                        onClick={() => setPassShow(!passShow)}
                      >
                        <FontAwesomeIcon icon={!passShow ? faEye : faEyeSlash} />
                      </div>
                    </div>
                  </label>
                </div>
                <p></p>
                <button type="submit" id="loginBtn" className="btn btn-primary fm-primary-btn">
                  <span id="loginBtnIcon" className="fas fa-sign-in-alt" aria-hidden="true"></span>
                  &nbsp;Log In
                </button>
              </form>
              <ul className="nav justify-content-center">
                <li className="nav-item">
                  <button
                    id="resetPasswordBtn"
                    className="nav-link btn btn-link"
                    onClick={() => navigate("/account/forgot-password")}
                  >
                    <u>Reset Password</u>
                  </button>
                </li>
                <li className="nav-item">
                  <Link to="/signup" className="nav-link btn btn-link">
                    <u>Create Account</u>
                  </Link>
                </li>
                <li className="nav-item d-md-none">
                  <Link to="/info" className="nav-link btn btn-link">
                    <u>About SpeedScore</u>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </main>
        {/* <footer className="text-left mt-4 footer d-none d-md-block"> */}
        <footer className="text-left mt-4 ">
          <p>
            {/* SpeedScore is supported and endorsed by <a href="https://www.speedgolfusa.com/" target="_blank" rel="noopener noreferrer">Speedgolf USA</a> and the <a href="https://www.playspeedgolf.com/isga" target="_blank" rel="noopener noreferrer">International Speedgolf Alliance</a>. */}
          </p>
          <p>
            SpeedScore is developed by the{" "}
            <a href="https://speedgolf.oregonstate.edu/" target="_blank" rel="noopener noreferrer">
              Speedgolf Technology and Analytics Lab
            </a>{" "}
            at the School of EECS at Oregon State University, led by{" "}
            <a
              href="https://engineering.oregonstate.edu/people/christopher-hundhausen"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chris Hundhausen
            </a>
            , the "Professor of Speedgolf".
          </p>
          {/* Add a new line for the fake users button */}
          {/* uncomment below line only when your in testing mode */}
          {/* <strong>For testing purposes:</strong>
          <div className="nav-item mt-2">
            <button
              id="generateFakeUsersBtn"
              className="btn btn-sm btn-secondary"
              onClick={async () => {
                try {
                  // Call the service
                  const response = await fakerUserGenerator();
                  if (response.status === 200) {
                    alert("Fake users generated successfully!");
                  } else {
                    alert(`Failed to generate fake users. Status: ${response.status}`);
                  }
                } catch (error) {
                  console.error("Error generating fake users:", error);
                  alert("An error occurred while generating fake users.");
                }
              }}
            >
              Generate Fake Users
            </button>
          </div> */}
        </footer>
      </div>
    </>
  );
};

export default LoginPage;
