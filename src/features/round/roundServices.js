import axios from "axios";

const apiURL = process.env.REACT_APP_API_BASE_ENDPOINT;

const callServer = async (method, endpoint, data, token, options = {}) => {
  let response = null;
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      params: options.params,
    };
    if (method.toLowerCase() === "get" || method.toLowerCase() === "delete") {
      response = await axios[method](apiURL + endpoint, config);
    } else {
      response = await axios[method](apiURL + endpoint, data, config);
    }
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const logRound = async (roundData, token) => {
  return callServer("post", "rounds", roundData, token, {});
};

export const fetchRounds = async token => {
  return callServer("get", "rounds", null, token, {});
};

export const deleteRound = async (roundId, token) => {
  return callServer("delete", `rounds/${roundId}`, null, token, {});
};

export const updateRound = async (roundId, roundData, token) => {
  return callServer("put", `rounds/${roundId}`, roundData, token, {});
};

export const fetchRoundById = async (roundId, token) => {
  console.log("Inside fetch round roundId", roundId);
  return callServer("get", `rounds/${roundId}`, null, token, {});
};
