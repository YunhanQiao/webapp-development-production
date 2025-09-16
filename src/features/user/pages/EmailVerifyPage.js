import { useEffect, useState } from "react";
import Navbar from "../../shared/Navbar/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { emailValidator } from "../../../services/userAuthenticationServices";
import { useNavigate } from "react-router-dom";
import { notifyMessage } from "../../../services/toasterServices";
import { resendVerificationEmailService } from "../userServices";
import { setLoading, setError } from "../userSlice";

const EmailVerify = () => {
  const [emailError, setEmailError] = useState(false);
  const [email, setEmail] = useState("");
  const isLoading = useSelector(state => state.user.isLoading);
  const userAuthenticated = useSelector(state => state.user.authenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitHandler = async event => {
    event.preventDefault();
    dispatch(setLoading(true));
    let enteredEmail = email;
    let emailValid = emailValidator(enteredEmail);
    if (emailValid) {
      const res = await resendVerificationEmailService(enteredEmail);
      console.log(res);
      if (res.status === 200) {
        notifyMessage("success", "Email sent successfully", 1000, "colored", "top-center");
      } else {
        notifyMessage("error", res.data.message, 1000, "colored", "top-center");
      }
    } else {
      setEmailError(!emailValid);
    }
    dispatch(setLoading(false));
  };

  const emailChangeHandler = event => {
    setEmail(event.target.value);
  };

  useEffect(() => {
    if (userAuthenticated) navigate("/feed");
  }, [userAuthenticated, navigate]);

  return (
    <>
      <Navbar />
      <div id='verifyEmailPage' className='mode-page'>
        <h1 className='mode-page-header'>Enter your email</h1>
        <p id='emailErrorBox' className={`alert alert-danger centered ${emailError ? "" : "hidden"}`}>
          <a id='emailError' href='#email' className={`alert-link ${emailError ? "" : "hidden"}`}>
            Enter a valid email address
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
            &nbsp;{isLoading ? "Sending..." : "Resend Email"}
          </button>
        </form>
      </div>
    </>
  );
};

export default EmailVerify;
