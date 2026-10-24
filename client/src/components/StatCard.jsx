const StatCard = ({ icon, label, value, sub }) => (
  <div className="card stat-card h-100">
    <div className="card-body d-flex align-items-center gap-3">
      <div className="stat-icon">
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fs-3 fw-bold lh-1">{value ?? '-'}</div>
        {sub && <div className="small text-muted mt-1">{sub}</div>}
      </div>
    </div>
  </div>
);

export default StatCard;
