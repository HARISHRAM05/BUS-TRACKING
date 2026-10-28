// Route detail: all stops with pickup times, the assigned bus & driver, and the route's schedules
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { routeApi, getErrorMessage } from '../../services/api';
import { BUS_STATUS_BADGE, formatDays, to12h } from '../../utils/format';
import useLiveTracking from '../../utils/useLiveTracking';
import BusMap from '../../components/BusMap';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const RouteDetail = () => {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { routes: tracked } = useLiveTracking(8000);

  useEffect(() => {
    setLoading(true);
    routeApi
      .get(id)
      .then(setRoute)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader text="Loading route..." />;
  if (error || !route) {
    return (
      <div className="container py-5">
        <EmptyState
          icon="bi-signpost"
          title="Route not available"
          message={error}
          action={<Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link>}
        />
      </div>
    );
  }

  // Use the freshly polled copy of this route (it carries the bus's latest position)
  const mapRoute = tracked.find((r) => r._id === route._id) || route;
  const hasMap = mapRoute.stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)).length >= 2;
  const bus = mapRoute.assignedBus || route.assignedBus;

  return (
    <div className="container py-4">
      <Link to="/dashboard" className="small text-decoration-none">
        <i className="bi bi-arrow-left me-1" />Back to all routes
      </Link>

      <div className="mt-3">
        <AnnouncementBanner routeId={route._id} />
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mb-4">
        <span className="badge bg-ku fs-6">{route.routeCode}</span>
        <h1 className="h3 fw-bold text-ku mb-0">{route.routeName}</h1>
        <span className="text-muted ms-md-auto">
          <i className="bi bi-geo-alt me-1" />
          {route.startPoint} → {route.endPoint} · {route.distanceKm} km
        </span>
      </div>

      <div className="row g-4">
        {/* Stops timeline */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-signpost-2 me-2 text-ku" />
                Stops & morning pickup times
              </h2>
              <ol className="stop-timeline mb-0">
                {route.stops.map((s) => (
                  <li key={s.order}>
                    <span className="dot" />
                    <div className="d-flex justify-content-between gap-3">
                      <span>
                        <span className="text-muted small me-2">{s.order}.</span>
                        {s.stopName}
                      </span>
                      <span className="fw-semibold text-nowrap">{to12h(s.pickupTime)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Bus & driver */}
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-bus-front me-2 text-ku" />
                Assigned bus & driver
              </h2>
              {bus ? (
                <dl className="row mb-0 small">
                  <dt className="col-5 text-muted fw-normal">Bus number</dt>
                  <dd className="col-7 fw-semibold">{bus.busNumber}</dd>
                  <dt className="col-5 text-muted fw-normal">Registration</dt>
                  <dd className="col-7">{bus.registrationNo}</dd>
                  <dt className="col-5 text-muted fw-normal">Capacity</dt>
                  <dd className="col-7">{bus.capacity} seats</dd>
                  <dt className="col-5 text-muted fw-normal">Status</dt>
                  <dd className="col-7"><span className={`badge ${BUS_STATUS_BADGE[bus.status]}`}>{bus.status}</span></dd>
                  <dt className="col-5 text-muted fw-normal">Driver</dt>
                  <dd className="col-7">{bus.driverName}</dd>
                  <dt className="col-5 text-muted fw-normal">Driver phone</dt>
                  <dd className="col-7 mb-0"><a href={`tel:${bus.driverPhone}`}>{bus.driverPhone}</a></dd>
                </dl>
              ) : (
                <EmptyState icon="bi-bus-front" title="No bus assigned yet" message="The Transport Office will assign a bus soon." />
              )}
            </div>
          </div>
        </div>

        {/* Map: this route's line, stops and bus */}
        <div className="col-12">
          <div className="card">
            <div className="card-body pb-2">
              <h2 className="h6 fw-bold mb-1">
                <i className="bi bi-map me-2 text-ku" />
                Route map
              </h2>
              <p className="small text-muted mb-2">
                Numbered circles are stops in order; the graduation-cap marker is the campus.
                {hasMap ? ' The orange bus marker updates every few seconds.' : ''}
              </p>
            </div>
            {hasMap ? (
              <BusMap routes={[mapRoute]} height={420} />
            ) : (
              <EmptyState icon="bi-map" title="No map positions yet" message="The Transport Office has not added map positions for this route's stops." />
            )}
          </div>
        </div>

        {/* Schedules on this route */}
        <div className="col-12">
          <div className="card">
            <div className="card-body pb-0">
              <h2 className="h6 fw-bold">
                <i className="bi bi-calendar-week me-2 text-ku" />
                Trips on this route
              </h2>
            </div>
            {route.schedules.length === 0 ? (
              <EmptyState icon="bi-calendar-x" title="No trips scheduled" />
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Shift</th>
                      <th>Direction</th>
                      <th>Departs</th>
                      <th>Arrives</th>
                      <th>Bus</th>
                      <th>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {route.schedules.map((s) => (
                      <tr key={s._id}>
                        <td>{s.shift}</td>
                        <td>{s.direction}</td>
                        <td className="fw-semibold">{to12h(s.departureTime)}</td>
                        <td>{to12h(s.arrivalTime)}</td>
                        <td>{s.bus?.busNumber}</td>
                        <td className="small">{formatDays(s.daysOfOperation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;
