import { capitalize } from "lodash";

function RoundsTableHeader({ name, onClick, sortIconClass }) {
  const heading = name[0].toUpperCase() === name[0] ? name : capitalize(name);

  return (
    <th scope="col" role="columnheader" className="sortable-header cell-align-middle" aria-sort="none">
      <button
        className="btn bg-transparent table-sort-btn pl-0"
        aria-label={`Sort ascending by ${name}`}
        onClick={onClick}>
        <span className={`fas sort-icon ${sortIconClass}`} />
      </button>
      {heading}
    </th>
  );
}

export default RoundsTableHeader;
