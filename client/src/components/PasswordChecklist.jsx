// Live checklist showing which password rules are met
import { passwordChecks } from '../utils/validation';

const PasswordChecklist = ({ password }) => {
  if (!password) return null;
  return (
    <ul className="list-unstyled small mb-3 mt-n2">
      {passwordChecks(password).map((c) => (
        <li key={c.label} className={c.ok ? 'text-success' : 'text-muted'}>
          <i className={`bi ${c.ok ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} />
          {c.label}
        </li>
      ))}
    </ul>
  );
};

export default PasswordChecklist;
