import User from "../models/user.model";

export const validAccount = (email, password) => {
  let acct = localStorage.getItem(email);
  if (acct === null) {
    return false;
  }
  acct = JSON.parse(acct);
  if (acct.accountInfo.password !== password) {
    return false;
  }
  return true;
};

export const checkIfUserExistsInLocalDB = email => {
  let acct = localStorage.getItem(email);
  if (acct === null) {
    return false;
  }
  return true;
};

export const fileToBase64 = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject("Could not convert file into string");
  });
};

export const fetchUserFromLocalDB = email => {
  let acct = localStorage.getItem(email);
  if (acct === null) {
    return false;
  }
  acct = JSON.parse(acct);
  return acct;
};

export const emailValidator = email => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return emailRegex.test(email);
};

export const passwordValidator = password => {
  // Passwords must be at least 8 characters long with at least one
  // number, one lower case letter, and one upper case letter.
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return passwordRegex.test(password);
};

export const displayNameValidator = name => {
  return name.length >= 1;
};

export const securityQuestionValidator = question => {
  if (question === null) {
    return true;
  }
  return question.length >= 5;
};

export const securityAnswerValidator = (answer, question) => {
  if (question !== null && answer === null) return false;
  if (answer === null) {
    return true;
  }
  return answer.length >= 5;
};
//TODO create a folder model and inside that create User.model.js and paste this object there and export it in both places.
//That model should handle null , create a class with constructor .(class object here in both places)
export const createAccount = userObject => {
  //Build account object from form data
  const newAcct = new User(userObject);
  //Save account to localStorage as key-value pair
  
  localStorage.setItem(newAcct.accountInfo.email, JSON.stringify(newAcct));

  // TODO: Add try catch to this function, and control value in newAccount based on storage success
  return { accountStoredInLocalDb: true, newAcct };
  //Reset form in case it is visited again
  // resetCreateAccountForm();
  //Transition to "Log In" page
  // document.title = "Log In to SpeedScore";
  // GlobalCreateAccountDialog.classList.add("hidden");
  // GlobalLoginPage.classList.remove("hidden");
  // GlobalAccountCreatedEmail.textContent = newAcct.email;
  // GlobalAccountCreated.classList.remove("hidden");
};

// * we are using this to create a null user state. we will require the authenticated property
export const exportNullUser = () => {
  return new User();
};

export const calculatePasswordStrength = password => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/\W/.test(password)) strength++;
  return strength;
};
