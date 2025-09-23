const NewTournamentFooter = ({ handlePrevious, handleCancel, handleSaveExit, handleSaveNext }) => {
  return (
    <div className="d-flex mb-3">
      {handlePrevious && (
        <button className="mode-page-btn action-dialog action-button" type="button" onClick={handlePrevious}>
          <i className="fa fa-solid fa-angles-left" />
          &nbsp; Previous
        </button>
      )}
      <button className="mode-page-btn-cancel action-dialog cancel-button" type="button" onClick={handleCancel}>
        Cancel Changes & Exit
      </button>
      <button className="mode-page-btn action-dialog action-button" type="button" onClick={handleSaveExit}>
        Save & Exit
      </button>
      {handleSaveNext && (
        <button className="mode-page-btn action-dialog action-button" type="button" onClick={handleSaveNext}>
          Save & Next&nbsp;
          <i className="fa fa-solid fa-angles-right"></i>
        </button>
      )}
    </div>
  );
};

export default NewTournamentFooter;