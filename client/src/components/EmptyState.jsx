// Friendly message shown when a list has no records
const EmptyState = ({ icon = 'bi-inbox', title = 'Nothing here yet', message, action }) => (
  <div className="text-center py-5 px-3">
    <i className={`bi ${icon} display-5 text-ku opacity-50`} />
    <h6 className="mt-3 mb-1">{title}</h6>
    {message && <p className="text-muted small mb-3">{message}</p>}
    {action}
  </div>
);

export default EmptyState;
