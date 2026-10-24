// Live map: all routes and buses on one map, with a list to pick a route
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useLiveTracking from '../../utils/useLiveTracking';
import { BUS_STATUS_BADGE, timeAgo } from '../../utils/format';
import BusMap from '../../components/BusMap';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const LiveMap = () => {
  const { routes, loading, error } = useLiveTracking(8000);
  const [selectedId, setSelectedId] = useState(null);

  const isDemo = routes.some((r) => r.assignedBus?.location?.source === 'simulated');
  const selected = routes.find((r) => r._id === selectedId);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div>
          <h1 className="h3 fw-bold text-ku mb-1">Live Bus Map</h1>
          <p className="text-muted mb-0">See where the college buses are between Coimbatore and Karunya Nagar.</p>
        </div>
        {selected && (
          <button className="btn btn-outline-secondary ms-md-auto" onClick={() => setSelectedId(null)}>
            <i className="bi bi-arrows-fullscreen me-1" />Show all routes
          </button>
        )}
      </div>

      {isDemo && (
        <div className="alert alert-info py-2 small">
          <i className="bi bi-info-circle me-1" />
          <strong>Demo positions.</strong> Buses are not fitted with GPS trackers yet, so their movement here is simulated
          along each route. Stop positions are approximate.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <Loader text="Loading map..." />
      ) : routes.length === 0 ? (
        <div className="card">
          <EmptyState icon="bi-map" title="No routes yet" message="Routes will appear on the map once the Transport Office adds them." />
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card">
              <BusMap routes={routes} selectedId={selectedId} onSelect={setSelectedId} height={540} />
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="list-group list-group-flush route-list">
                {routes.map((r) => {
                  const bus = r.assignedBus;
                  const loc = bus?.location;
                  const active = r._id === selectedId;
                  return (
                    <button
                      key={r._id}
                      className={`list-group-item list-group-item-action ${active ? 'active-route' : ''}`}
                      onClick={() => setSelectedId(active ? null : r._id)}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <span className="badge bg-ku me-2">{r.routeCode}</span>
                          <span className="fw-semibold small">{r.routeName}</span>
                        </div>
                        {bus && <span className={`badge ${BUS_STATUS_BADGE[bus.status]}`}>{bus.status}</span>}
                      </div>
                      <div className="small text-muted mt-1">
                        {bus ? (
                          <>
                            <i className="bi bi-bus-front me-1" />
                            {bus.busNumber} · {bus.driverName}
                            <br />
                            <i className="bi bi-geo-alt me-1" />
                            {loc?.updatedAt ? `Seen ${timeAgo(loc.updatedAt)}` : 'No location yet'}
                          </>
                        ) : (
                          'No bus assigned'
                        )}
                      </div>
                      {active && (
                        <Link to={`/routes/${r._id}`} className="small d-inline-block mt-2" onClick={(e) => e.stopPropagation()}>
                          Stops & timings <i className="bi bi-arrow-right" />
                        </Link>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
