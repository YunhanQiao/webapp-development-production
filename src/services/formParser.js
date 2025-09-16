import User from "../models/user.model";

function jsonToFormData(jsonObject, form = new FormData(), namespace = "") {
  for (let propertyName in jsonObject) {
    if (!jsonObject.hasOwnProperty(propertyName)) continue;
    if (propertyName === "profilePic") {
      continue;
    }
    const formKey = namespace ? `${namespace}[${propertyName}]` : propertyName;

    if (jsonObject[propertyName] instanceof Date) {
      // Convert Date objects to YYYY-MM-DD format (timezone-neutral)
      const year = jsonObject[propertyName].getFullYear();
      const month = String(jsonObject[propertyName].getMonth() + 1).padStart(2, "0");
      const day = String(jsonObject[propertyName].getDate()).padStart(2, "0");
      form.append(formKey, `${year}-${month}-${day}`);
    } else if (typeof jsonObject[propertyName] === "object" && !(jsonObject[propertyName] instanceof File)) {
      jsonToFormData(jsonObject[propertyName], form, formKey);
    } else {
      form.append(formKey, jsonObject[propertyName]);
    }
  }
  return form;
}

export const prepareRegistrationFormData = (values, avatar, newUser = true) => {
  let formData = new FormData();
  let user = newUser ? new User(values) : values;
  // user.personalInfo.profilePic = avatar;
  console.log("USER in FORM PARSER: ", user);
  formData = jsonToFormData(user, formData);
  formData.append("personalInfo.profilePic", avatar);
  return formData;
};

export const prepareCourseInfoUpdate = values => {
  let formData = new FormData();
  formData = jsonToFormData(values, formData);
  return formData;
};
