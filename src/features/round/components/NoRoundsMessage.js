import { NO_ROUNDS_ADDED } from "../utils";

const NoRoundsMessage = () => {
  return (
    <tr>
      <td colSpan="7" scope="rowgroup">
        <i>{NO_ROUNDS_ADDED}</i>
      </td>
    </tr>
  );
};

export default NoRoundsMessage;
