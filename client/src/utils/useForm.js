// Small form-state hook: values, inline errors and a generic change handler
import { useState } from 'react';

const useForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    // Clear that field's error as soon as the user edits it
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const reset = (next = initialValues) => {
    setValues(next);
    setErrors({});
  };

  return { values, setValues, errors, setErrors, handleChange, reset };
};

export default useForm;
