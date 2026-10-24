// React-controlled Bootstrap modal (rendered only while open, no Bootstrap JS needed)
import { useEffect } from 'react';

const Modal = ({ show, title, onClose, children, footer, size = '' }) => {
  // Close on Escape and stop the page behind from scrolling
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('overflow-hidden');
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom" onClick={onClose} />
      <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" onClick={onClose}>
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
