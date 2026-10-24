// "Are you sure?" dialog used before every delete
import Modal from './Modal';

const ConfirmModal = ({ show, title = 'Confirm delete', message, confirmText = 'Delete', busy, onConfirm, onClose }) => (
  <Modal
    show={show}
    title={title}
    onClose={busy ? () => {} : onClose}
    footer={
      <>
        <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" />}
          {confirmText}
        </button>
      </>
    }
  >
    <div className="d-flex gap-3">
      <i className="bi bi-exclamation-triangle-fill text-danger fs-3" />
      <p className="mb-0">{message}</p>
    </div>
  </Modal>
);

export default ConfirmModal;
