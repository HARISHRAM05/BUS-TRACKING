// Public landing page
import { Link } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import LogoSlot from '../components/LogoSlot';

const FEATURES = [
  { icon: 'bi-signpost-split', title: 'Routes & stops', text: 'Every college bus route between Coimbatore city and Karunya Nagar, with all stops in order.' },
  { icon: 'bi-clock-history', title: 'Pickup timings', text: 'Morning pickup times and evening departure times from campus, day by day.' },
  { icon: 'bi-bus-front', title: 'Bus & driver info', text: 'Bus number, registration, capacity and the driver assigned to your route.' },
  { icon: 'bi-map', title: 'Live bus map', text: 'See each route on a map with its stops and where the bus is right now.' },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <>
      <section className="hero py-5">
        <div className="container py-lg-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge bg-light text-ku mb-3">Karunya Institute of Technology and Sciences</span>
              <h1 className="display-5 fw-bold">Karunya Bus Tracking Portal</h1>
              <p className="lead opacity-75 mt-3">
                The official place to check college bus routes, stops and timings for students and staff
                travelling between Coimbatore city and the Karunya Nagar campus. Published and kept up to date by
                the Karunya Transport Office.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                {user ? (
                  <Link to={homePathFor(user)} className="btn btn-light btn-lg text-ku fw-semibold">
                    <i className="bi bi-arrow-right-circle me-2" />Go to my dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-light btn-lg text-ku fw-semibold">
                      <i className="bi bi-box-arrow-in-right me-2" />Login
                    </Link>
                    <Link to="/signup" className="btn btn-outline-light btn-lg">
                      <i className="bi bi-person-plus me-2" />Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="col-lg-5 text-center">
              {/* LOGO SLOT - drop the official logo at client/public/karunya-logo.png */}
              <div className="bg-white rounded-4 p-4 d-inline-block shadow">
                <LogoSlot height={140} />
              </div>
              <p className="small mt-3 mb-0 opacity-75">
                <i className="bi bi-geo-alt-fill me-1" />
                Karunya Nagar, Coimbatore - 641114, Tamil Nadu
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <h2 className="h4 text-center fw-bold mb-4">What you can do here</h2>
        <div className="row g-3">
          {FEATURES.map((f) => (
            <div className="col-sm-6 col-lg-3" key={f.title}>
              <div className="card h-100 text-center p-3">
                <i className={`bi ${f.icon} fs-1 text-ku`} />
                <h3 className="h6 fw-bold mt-2">{f.title}</h3>
                <p className="small text-muted mb-0">{f.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-ku-light mt-5">
          <div className="card-body d-md-flex align-items-center justify-content-between gap-3">
            <div>
              <h3 className="h6 fw-bold mb-1">Serving areas across Coimbatore</h3>
              <p className="small text-muted mb-md-0">
                Gandhipuram · Ukkadam · RS Puram · Saibaba Colony · Singanallur · Peelamedu · Vadavalli ·
                Thudiyalur · Alandurai and more - all ending at Karunya Nagar campus.
              </p>
            </div>
            {!user && (
              <Link to="/signup" className="btn btn-primary text-nowrap">
                Create your account
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Landing;
