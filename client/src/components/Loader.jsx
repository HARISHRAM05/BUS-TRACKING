// Centered spinner used while data is loading
const Loader = ({ text = 'Loading...', fullPage = false }) => (
  <div className={`d-flex flex-column align-items-center justify-content-center text-ku ${fullPage ? 'vh-100' : 'py-5'}`}>
    <div className="spinner-border" role="status" aria-hidden="true" />
    <span className="mt-2 small text-muted">{text}</span>
  </div>
);

export default Loader;
