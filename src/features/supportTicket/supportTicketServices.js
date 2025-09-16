import axios from "axios";
const apiURL = process.env.REACT_APP_API_BASE_ENDPOINT;

export const createTicket = async ticketData => {
  try {
    const response = await axios.post(`${apiURL}support/tickets`, ticketData);
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
