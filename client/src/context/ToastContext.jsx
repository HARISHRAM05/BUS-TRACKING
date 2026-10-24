// Simple toast notifications: const toast = useToast(); toast.success('Saved');
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: { bg: 'text-bg-success', icon: 'bi-check-circle-fill' },
  error: { bg: 'text-bg-danger', icon: 'bi-x-circle-fill' },
  info: { bg: 'text-bg-primary', icon: 'bi-info-circle-fill' },
};

let nextId = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type, message) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => show('success', m),
      error: (m) => show('error', m),
      info: (m) => show('info', m),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast show align-items-center border-0 mb-2 ${STYLES[t.type].bg}`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi ${STYLES[t.type].icon} me-2`} />
                {t.message}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close"
                onClick={() => dismiss(t.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
