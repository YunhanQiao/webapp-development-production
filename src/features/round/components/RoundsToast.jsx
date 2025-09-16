function RoundsToast() {
  return (
    <div id="roundUpdated" className="toast-container hidden" role="alert" aria-atomic="true" aria-live="assertive">
      <div id="roundUpdatedMsg" className="toast-text">
        New round was logged
      </div>
      <button id="roundUpdatedClose" type="button" className="btn-close toast-close" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

export default RoundsToast;
