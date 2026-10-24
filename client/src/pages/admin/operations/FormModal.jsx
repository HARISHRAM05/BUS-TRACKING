// Modal wrapper for add/edit forms: handles validation, submit spinner and server errors
import { useState } from 'react';
import Modal from '../../../components/Modal';
import { getErrorMessage, getFieldErrors } from '../../../services/api';

/**
 * props:
 *  - validate(values) -> errors object (client-side)
 *  - toPayload(values) -> body sent to the API
 *  - onSave(payload)  -> Promise (throws axios error on failure)
 *  - form: { values, errors, setErrors }   from useForm()
 */
const FormModal = ({ show, title, onClose, form, validate, toPayload = (v) => v, onSave, size, children }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const errs = validate(form.values);
    form.setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await onSave(toPayload(form.values));
    } catch (err) {
      form.setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setFormError('');
    onClose();
  };

  return (
    <Modal
      show={show}
      title={title}
      onClose={submitting ? () => {} : close}
      size={size}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={close} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="crud-form" className="btn btn-primary" disabled={submitting}>
            {submitting && <span className="spinner-border spinner-border-sm me-2" />}
            Save
          </button>
        </>
      }
    >
      {formError && <div className="alert alert-danger py-2 small">{formError}</div>}
      <form id="crud-form" onSubmit={handleSubmit} noValidate>
        {children}
      </form>
    </Modal>
  );
};

export default FormModal;
