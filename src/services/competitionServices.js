function jsonToFormData(jsonObject, form = new FormData(), namespace = "") {
  for (let propertyName in jsonObject) {
    if (!jsonObject.hasOwnProperty(propertyName)) continue;
    if (propertyName === "logo" || propertyName === "rules") {
      continue;
    }
    const formKey = namespace ? `${namespace}[${propertyName}]` : propertyName;
    if (jsonObject[propertyName] instanceof Date) {
      // Use local date format to avoid timezone conversion issues
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

// used for formatting date
export const formatDate = date => {
  if (typeof date === "string") {
    return date.slice(0, 10);
  }
  if (date instanceof Date) {
    // Use local date format to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return date; // If it's already a string, return as is
};

export const prepareFormData = (data, competitionId = null) => {
  const formData = new FormData();
  if (competitionId) {
    formData.append("competitionId", competitionId);
  }

  Object.keys(data).forEach(key => {
    // Skip file fields entirely if they are null/empty (to match staging behavior)
    if (
      (key === "logo" || key === "rules" || key === "prizeDoc" || key === "additionalInfoDoc") &&
      (data[key] === null || data[key] === "")
    ) {
      // Don't append anything - staging doesn't send these fields at all
      return;
    } else if (key === "logo" && data[key] && data[key].startsWith("data:image")) {
      const base64Data = data[key].split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data[key].split(";")[0].split(":")[1] });

      formData.append("logo", blob, "logo.png");
    } else if (
      (key === "rules" || key === "prizeDoc" || key === "additionalInfoDoc") &&
      data[key] &&
      data[key].startsWith("data:application/pdf")
    ) {
      const base64Data = data[key].split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      formData.append(key, blob, `${key}.pdf`);
    } else if (
      (key === "logo" || key === "rules" || key === "prizeDoc" || key === "additionalInfoDoc") &&
      typeof data[key] === "string" &&
      data[key].includes("s3.amazonaws.com")
    ) {
      formData.append(key, data[key]);
    } else if (Array.isArray(data[key])) {
      data[key].forEach((item, index) => {
        if (typeof item === "object") {
          Object.keys(item).forEach(nestedKey => {
            formData.append(`${key}[${index}][${nestedKey}]`, item[nestedKey]);
          });
        } else {
          formData.append(`${key}[${index}]`, item);
        }
      });
    } else if (data[key] !== null && typeof data[key] === "object" && !(data[key] instanceof Date)) {
      Object.keys(data[key]).forEach(nestedKey => {
        formData.append(`${key}[${nestedKey}]`, data[key][nestedKey]);
      });
    } else if (data[key] !== undefined && data[key] !== null) {
      if (data[key] instanceof Date) {
        // Use local date format to avoid timezone conversion issues
        // For tournament dates, we want to preserve the local date exactly as entered
        const year = data[key].getFullYear();
        const month = String(data[key].getMonth() + 1).padStart(2, "0");
        const day = String(data[key].getDate()).padStart(2, "0");
        formData.append(key, `${year}-${month}-${day}`);
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  return formData;
};

// Function to convert a base64 string to a Blob
const base64ToBlobToFile = (base64, fileName) => {
  const mime = extractMimeType(base64);
  const byteString = atob(base64.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return blobToFile(new Blob([ia], { type: mime }), `${fileName}${getFileExtension(mime)}`);
  // + getFileExtension(mime)
};

// Function to convert a Blob to a File
const blobToFile = (blob, fileName) => {
  return new File([blob], fileName, { type: blob.type });
};

const extractMimeType = base64String => {
  const mimeMatch = base64String.match(/data:([^;]+);base64,/);
  return mimeMatch ? mimeMatch[1] : null;
};

const getFileExtension = mimeType => {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/bmp":
      return "bmp";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "application/pdf":
      return "pdf";
    case "application/msword":
      return "doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    default:
      return "";
  }
};

// export const fileToBase64 = file => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);

//     reader.onload = () => resolve(reader.result);
//     reader.onerror = error => reject("Could not convert file into string");
//   });
// };
