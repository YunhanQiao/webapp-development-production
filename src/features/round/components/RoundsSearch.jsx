function RoundsSearch({ value, onChange }) {
  return (
    <div className="d-flex justify-content-center align-items-center">
      <div className="me-2">Search/Filter:</div>
      <div className="w-25">
        <input type="text" className="form-control" placeholder="" value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export default RoundsSearch;
