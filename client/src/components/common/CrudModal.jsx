function CrudModal({ open, title, children, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="crud-modal-wrap" role="dialog" aria-modal="true">
      <button
        type="button"
        className="crud-modal-backdrop"
        onClick={onClose}
        aria-label="Close modal"
      />
      <section className="crud-modal-card">
        <header className="crud-modal-header">
          <h3>{title}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="crud-modal-content">{children}</div>
      </section>
    </div>
  );
}

export default CrudModal;
