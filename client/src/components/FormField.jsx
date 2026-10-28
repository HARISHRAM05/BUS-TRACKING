// Reusable form controls that show an inline error under the field
import { useState } from 'react';

export const TextField = ({ label, name, value, onChange, error, type = 'text', required, hint, ...rest }) => (
  <div className="mb-3">
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <input
      id={name}
      name={name}
      type={type}
      className={`form-control ${error ? 'is-invalid' : ''}`}
      value={value ?? ''}
      onChange={onChange}
      {...rest}
    />
    {error ? <div className="invalid-feedback">{error}</div> : hint && <div className="form-text">{hint}</div>}
  </div>
);

export const TextAreaField = ({ label, name, value, onChange, error, required, hint, rows = 3, maxLength, ...rest }) => (
  <div className="mb-3">
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <textarea
      id={name}
      name={name}
      rows={rows}
      maxLength={maxLength}
      className={`form-control ${error ? 'is-invalid' : ''}`}
      value={value ?? ''}
      onChange={onChange}
      {...rest}
    />
    {error ? (
      <div className="invalid-feedback">{error}</div>
    ) : (
      (hint || maxLength) && (
        <div className="form-text d-flex justify-content-between">
          <span>{hint}</span>
          {maxLength && <span>{(value ?? '').length}/{maxLength}</span>}
        </div>
      )
    )}
  </div>
);

export const SelectField =({ label, name, value, onChange, error, options, placeholder, required, ...rest }) => (
  <div className="mb-3">
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <select
      id={name}
      name={name}
      className={`form-select ${error ? 'is-invalid' : ''}`}
      value={value ?? ''}
      onChange={onChange}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);

// Password input with a show/hide eye button
export const PasswordField = ({ label, name, value, onChange, error, required, hint, ...rest }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="input-group has-validation">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={value ?? ''}
          onChange={onChange}
          {...rest}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} />
        </button>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
      {!error && hint && <div className="form-text">{hint}</div>}
    </div>
  );
};
