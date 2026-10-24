import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

const NotFound = () => (
  <div className="container py-5">
    <EmptyState
      icon="bi-signpost"
      title="Page not found"
      message="This stop isn't on any route. Let's take you back."
      action={<Link to="/" className="btn btn-primary">Go home</Link>}
    />
  </div>
);

export default NotFound;
