import axios from "axios";

export const getTournamentNameAbbr = tournamentName => {
  const words = tournamentName.split(" ");
  const firstLetters = words.map(word => word.charAt(0));
  return firstLetters.join("");
};

export const generateUniqueTournamentName = (tournamentName, existingTournaments = [], startDate = null) => {
  if (!tournamentName || tournamentName.trim() === "") {
    console.log("Empty tournament name provided");
    return "";
  }

  if (!existingTournaments || !Array.isArray(existingTournaments) || existingTournaments.length === 0) {
    const baseAbbr = getTournamentNameAbbr(tournamentName);
    let year;

    if (startDate) {
      try {
        const dateObj = startDate instanceof Date ? startDate : new Date(startDate);
        if (!isNaN(dateObj.getTime())) {
          year = dateObj.getFullYear().toString().substr(-2);
        } else {
          year = new Date().getFullYear().toString().substr(-2);
        }
      } catch (e) {
        console.error("Error parsing date:", e);
        year = new Date().getFullYear().toString().substr(-2);
      }
    } else {
      year = new Date().getFullYear().toString().substr(-2);
    }

    const uniqueName = baseAbbr + year;
    console.log("Generated name with no existing tournaments:", uniqueName);
    return uniqueName;
  }

  const words = tournamentName.split(" ").filter(word => word.trim().length > 0);
  if (words.length === 0) {
    return "";
  }

  let year;
  if (startDate) {
    try {
      const dateObj = startDate instanceof Date ? startDate : new Date(startDate);
      if (!isNaN(dateObj.getTime())) {
        year = dateObj.getFullYear().toString().substr(-2);
      } else {
        year = new Date().getFullYear().toString().substr(-2);
      }
    } catch (e) {
      year = new Date().getFullYear().toString().substr(-2);
      console.error("Error parsing date:", e);
    }
  } else {
    year = new Date().getFullYear().toString().substr(-2);
  }

  const existingUniqueNames = existingTournaments
    .filter(t => t && t.basicInfo && t.basicInfo.uniqueName)
    .map(t => t.basicInfo.uniqueName);

  const baseAbbr = getTournamentNameAbbr(tournamentName);
  const uniqueName = baseAbbr + year;
  if (!existingUniqueNames.includes(uniqueName)) {
    return uniqueName;
  }
  let charIndex = 1;
  while (charIndex < words[0].length) {
    let newName = words[0].substring(0, charIndex + 1);
    for (let i = 1; i < words.length; i++) {
      if (words[i] && words[i].length > 0) {
        newName += words[i][0];
      }
    }
    newName += year;

    if (!existingUniqueNames.includes(newName)) {
      return newName;
    }

    charIndex++;
  }
  let counter = 1;
  while (counter < 100) {
    const suffixedName = uniqueName + counter;

    if (!existingUniqueNames.includes(suffixedName)) {
      return suffixedName;
    }
    counter++;
  }
  const timestampName = uniqueName + Date.now().toString().slice(-3);
  return timestampName;
};

export const uuidv4 = () => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  );
};

export const objectIdGenerator = () => {
  var timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    "xxxxxxxxxxxxxxxx"
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
};

const competitionsApiUrl = process.env.REACT_APP_API_BASE_ENDPOINT + process.env.REACT_APP_COMPETITION_ENDPOINT;
const fetchAllUsersApiUrl =
  process.env.REACT_APP_API_BASE_ENDPOINT + process.env.REACT_APP_FETCH_ALL_USERNAMES_ENDPOINT;
const teesetsApiUrl = process.env.REACT_APP_API_BASE_ENDPOINT;

const apiGet = async (url, jwtToken) => {
  try {
    const response = await axios.get(`${url}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response ? error.response.status : 500,
      data: error.response ? error.response.data : { message: "Server Error" },
    };
  }
};

// Add PUT method for updating tournament data
const apiPut = async (endpoint, data, jwtToken, contentType = "application/json") => {
  try {
    const apiUrl = `${competitionsApiUrl}/${endpoint}`;

    console.log("🌐 API PUT Request Details:");
    console.log("  📍 URL:", apiUrl);
    console.log("  📋 Endpoint:", endpoint);
    console.log("  🔐 Content-Type:", contentType);
    console.log("  🎯 JWT Token (first 20 chars):", jwtToken ? jwtToken.substring(0, 20) + "..." : "NO TOKEN");
    console.log("  📦 Request Data:", data);

    const response = await axios.put(apiUrl, data, {
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    console.log("🌐 API PUT Response Details:");
    console.log("  ✅ Status:", response.status);
    console.log("  📊 Status Text:", response.statusText);
    console.log("  📄 Response Data:", response.data);
    console.log("  🏷️ Response Headers:", response.headers);

    return { status: response.status, statusText: response.statusText, data: response.data, headers: response.headers };
  } catch (err) {
    console.log("🌐 API PUT Error Details:");
    console.log("  ❌ Error Message:", err.message);
    console.log("  📊 Status:", err.response?.status);
    console.log("  📄 Response Data:", err.response?.data);
    throw err;
  }
};

const apiPost = async (endpoint, data, jwtToken, contentType) => {
  try {
    const apiUrl = `${competitionsApiUrl}/${endpoint}`;

    console.log("🌐 API POST Request Details:");
    console.log("  📍 URL:", apiUrl);
    console.log("  📋 Endpoint:", endpoint);
    console.log("  🔐 Content-Type:", contentType);
    console.log("  🎯 JWT Token (first 20 chars):", jwtToken ? jwtToken.substring(0, 20) + "..." : "NO TOKEN");

    // Log FormData contents if it's FormData
    if (data instanceof FormData) {
      console.log("  📦 FormData Contents:");
      for (let [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(`    ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`    ${key}:`, value);
        }
      }
    } else {
      console.log("  📦 Request Data:", data);
    }

    const response = await axios.post(apiUrl, data, {
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    console.log("🌐 API POST Response Details:");
    console.log("  ✅ Status:", response.status);
    console.log("  📊 Status Text:", response.statusText);
    console.log("  📄 Response Data:", response.data);
    console.log("  🏷️ Response Headers:", response.headers);

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.log("🌐 API POST Error Details:");
    console.log("  ❌ Error Message:", error.message);
    console.log("  📍 URL:", `${competitionsApiUrl}/${endpoint}`);

    if (error.response) {
      console.log("  📊 Error Status:", error.response.status);
      console.log("  📄 Error Data:", error.response.data);
      console.log("  🏷️ Error Headers:", error.response.headers);
    } else if (error.request) {
      console.log("  📡 Request was made but no response received:");
      console.log("  📤 Request:", error.request);
    } else {
      console.log("  ⚙️ Error in setting up request:", error.message);
    }

    return {
      status: error.response ? error.response.status : 500,
      data: error.response ? error.response.data : { message: "Server Error" },
    };
  }
};

export const fetchUsers = jwtToken => {
  return apiGet(fetchAllUsersApiUrl, jwtToken, "multipart/form-data");
};

export const saveBasicInfo = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/basic-info`, data, jwtToken, "multipart/form-data");
};

export const saveRegPaymentInfo = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/reg-payment-info`, data, jwtToken, "application/json");
};

export const saveColorThemeInfo = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/color-theme`, data, jwtToken, "application/json");
};

export const saveCoursesInfo = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/courses`, data, jwtToken, "application/json");
};

// export const saveRoundsInfo = (competitionId, data, jwtToken) => {
//   return apiPost(`${competitionId}/rounds`, data, jwtToken, "application/json");
// };

export const saveDivisionsInfo = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/divisions`, data, jwtToken, "application/json");
};

export const registerPlayerToTournament = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/player`, [data], jwtToken, "application/json");
};

export const createCompetition = (data, jwtToken) => {
  return apiPost(`newCompetition`, data, jwtToken);
};

export const getAllCompetitions = jwtToken => {
  return apiGet(competitionsApiUrl, jwtToken);
};

export const getCompetitionById = (id, jwtToken) => {
  return apiGet(`${competitionsApiUrl}/${id}`, jwtToken);
};

export const updatePublishStatus = (competitionId, publishStatus, stripeAccountId, jwtToken) => {
  return apiPost(
    `${competitionId}/publish`,
    { published: publishStatus, directorStripeAccountId: stripeAccountId },
    jwtToken,
    "application/json",
  );
};

// Fetch all teesets
export const fetchAllTeesets = jwtToken => {
  return apiGet(`${teesetsApiUrl}teesets`, jwtToken);
};

export const saveTeeSheetInfo = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/teesheet`, data, jwtToken, "application/json");
};

export const getTeeSheet = (competitionId, jwtToken) => {
  return apiGet(`${competitionsApiUrl}/${competitionId}/teesheet`, jwtToken);
};

export const savePlayerScores = (competitionId, scoreData, jwtToken) => {
  const dataToSend = {
    ...scoreData,
    competitionId,
  };
  return apiPost(`${competitionId}/scores`, dataToSend, jwtToken, "application/json");
};

export const createPaymentIntent = (competitionId, data, jwtToken) => {
  return apiPost(`${competitionId}/payment-intent`, data, jwtToken, "application/json");
};

export const processRefund = (competitionId, playerId, reason, jwtToken) => {
  return apiPost(`${competitionId}/player/${playerId}/refund`, { reason }, jwtToken, "application/json");
};

export const processTournamentPayout = (competitionId, jwtToken) => {
  return apiPost(`${competitionId}/process-payout`, {}, jwtToken, "application/json");
};

// !! Public

export const apiGetPublic = async url => {
  try {
    const response = await axios.get(`${url}`);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response ? error.response.status : 500,
      data: error.response ? error.response.data : { message: "Server Error" },
    };
  }
};

export const getPublicTournaments = () => {
  return apiGetPublic(`${competitionsApiUrl}/public`);
};

export const getPublicTournamentByUniqueName = uniqueName => {
  return apiGetPublic(`${competitionsApiUrl}/u/${uniqueName}`);
};

export const getPublicTournamentLeaderboard = uniqueName => {
  return apiGetPublic(`${competitionsApiUrl}/u/${uniqueName}/leaderboard`);
};

export const getPublicTournamentTeesheet = uniqueName => {
  return apiGetPublic(`${competitionsApiUrl}/u/${uniqueName}/teesheet`);
};
