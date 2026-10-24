// Search box + "Add" button shown above each admin table
const TableToolbar = ({ search, onSearch, placeholder, addLabel, onAdd, children }) => (
  <div className="d-flex flex-column flex-md-row gap-2 mb-3">
    <div className="input-group flex-grow-1" style={{ maxWidth: 420 }}>
      <span className="input-group-text bg-white">
        <i className="bi bi-search" />
      </span>
      <input
        type="search"
        className="form-control"
        placeholder={placeholder}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        maxLength={50}
      />
    </div>
    {children}
    <button className="btn btn-primary ms-md-auto" onClick={onAdd}>
      <i className="bi bi-plus-lg me-1" />
      {addLabel}
    </button>
  </div>
);

export default TableToolbar;
