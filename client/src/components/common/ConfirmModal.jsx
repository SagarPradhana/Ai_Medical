function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) {
    return null;
  }

  return (
    <div className="crud-modal-wrap" role="dialog" aria-modal="true">
      <button type="button" className="crud-modal-backdrop" onClick={onCancel} />
      <section className="crud-modal-card confirm-modal-card">
        <header className="crud-modal-header">
          <h3>{title}</h3>
        </header>
        <div className="crud-modal-content">
          <p>{message}</p>
          <div className="form-actions">
            <button type="button" className="module-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="module-btn solid danger" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
