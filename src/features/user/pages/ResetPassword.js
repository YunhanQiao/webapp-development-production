import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../../shared/Navbar/Navbar";
import { sendPasswordResetLink } from "../userActions";

const ResetPassword = () => {
  const [emailError, setEmailError] = useState(false);
  const [email, setEmail] = useState("");
  const isLoading = useSelector((state) => state.user.isLoading);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailChangeHandler = (event) => {
    setEmail(event.target.value);
  };
  const submitHandler = (event) => {
    event.preventDefault();
     if (!emailRegex.test(email)) {
      setEmailError(true);
      return;
     }
     else {
      setEmailError(false);
      setEmail("");
      dispatch(sendPasswordResetLink(email));
     }
  };

  return (
    <>
      <Navbar />
      <div id='verifyEmailPage' className='mode-page'>
        <h1 className='mode-page-header'>Password Reset</h1>
        <h4 className='text-center mt-2'>Enter your email!</h4>
        <p id='emailErrorBox' className={`alert alert-danger centered ${emailError ? "" : "hidden"}`}>
          <a id='emailError' href='#email' className={`alert-link ${emailError ? "" : "hidden"}`}>
            Enter valid email address
            <br />
          </a>
        </p>
        <form id='emailForm' className='centered' noValidate onSubmit={submitHandler}>
          <div className='mb-3'>
            <label htmlFor='email' className='form-label'>
              Email:
              <br />
              <input
                id='email'
                type='email'
                name='username'
                className='form-control-lg centered'
                aria-describedby='emailIdDescr'
                required
                value={email}
                onChange={emailChangeHandler}
              />
            </label>
            <div id='emailIdDescr' className='form-text'>
              Enter a valid email address.
            </div>
          </div>
          <button type='submit' id='submitBtn' className='btn btn-primary fm-primary-btn' disabled={isLoading}>
            <span id='submitBtnIcon' className='fas fa-sign-in-alt' aria-hidden='true'></span>
            &nbsp;{isLoading ? "Sending..." : "Send Link"}
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
    </>
  );
};

export default ResetPassword;
