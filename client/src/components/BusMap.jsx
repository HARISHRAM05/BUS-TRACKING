// Map of one or more routes: numbered stops, the route line, the campus and live bus markers.
// Uses Leaflet with OpenStreetMap tiles (free, no API key).
import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { to12h, timeAgo } from '../utils/format';

const KARUNYA_CENTER = [10.9358, 76.7437];

// Escape text before it goes inside the HTML of a map icon
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const stopIcon = (label, isCampus) =>
  L.divIcon({
    className: '',
    html: `<div class="map-stop ${isCampus ? 'map-stop-campus' : ''}">${isCampus ? '<i class="bi bi-mortarboard-fill"></i>' : esc(label)}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const busIcon = (label, selected) =>
  L.divIcon({
    className: '',
    html: `<div class="map-bus ${selected ? 'map-bus-selected' : ''}"><i class="bi bi-bus-front-fill"></i><span>${esc(label)}</span></div>`,
    iconSize: [74, 30],
    iconAnchor: [37, 15],
  });

// Stops that have map coordinates, in route order
const mappedStops = (route) =>
  [...(route.stops || [])]
    .sort((a, b) => a.order - b.order)
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

// Re-fit the view only when `fitKey` changes (not on every refresh, or the map would jump while panning)
const FitView = ({ points, fitKey }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    else map.setView(KARUNYA_CENTER, 11);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
};

/**
 * routes     - route objects with stops[] and assignedBus (incl. assignedBus.location)
 * selectedId - route to highlight (shows its stops); null = show every route's line
 * onSelect   - called with a route id when its line or bus is clicked
 */
const BusMap = ({ routes, selectedId = null, onSelect, height = 480 }) => {
  const single = routes.length === 1;
  const focusId = selectedId || (single ? routes[0]._id : null);
  const focused = routes.find((r) => r._id === focusId);

  const fitPoints = (focused ? [focused] : routes).flatMap((r) => mappedStops(r).map((s) => [s.lat, s.lng]));

  return (
    <div className="map-wrap" style={{ height }}>
      <MapContainer center={KARUNYA_CENTER} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitView points={fitPoints} fitKey={`${focusId}|${routes.length}`} />

        {/* Route lines */}
        {routes.map((r) => {
          const stops = mappedStops(r);
          if (stops.length < 2) return null;
          const isFocus = r._id === focusId;
          return (
            <Polyline
              key={r._id}
              positions={stops.map((s) => [s.lat, s.lng])}
              pathOptions={{
                color: isFocus ? '#0b3d91' : '#6c8fd6',
                weight: isFocus ? 5 : 3,
                opacity: focusId && !isFocus ? 0.45 : 0.9,
              }}
              eventHandlers={{ click: () => onSelect?.(r._id) }}
            />
          );
        })}

        {/* Numbered stops of the focused route; the last stop is the campus */}
        {focused &&
          mappedStops(focused).map((s, i, arr) => (
            <Marker key={`${focused._id}-${s.order}`} position={[s.lat, s.lng]} icon={stopIcon(s.order, i === arr.length - 1)}>
              <Popup>
                <strong>{s.stopName}</strong>
                <br />
                Stop {s.order} · {to12h(s.pickupTime)}
              </Popup>
            </Marker>
          ))}

        {/* Buses */}
        {routes.map((r) => {
          const bus = r.assignedBus;
          const loc = bus?.location;
          if (!Number.isFinite(loc?.lat) || !Number.isFinite(loc?.lng)) return null;
          return (
            <Marker
              key={`bus-${bus._id}`}
              position={[loc.lat, loc.lng]}
              icon={busIcon(bus.busNumber, r._id === focusId)}
              zIndexOffset={1000}
              eventHandlers={{ click: () => onSelect?.(r._id) }}
            >
              <Popup>
                <strong>Bus {bus.busNumber}</strong> · {r.routeCode}
                <br />
                {r.routeName}
                <br />
                Driver: {bus.driverName}
                <br />
                <span className="text-muted">
                  {loc.source === 'simulated' ? 'Demo position' : 'GPS'} · updated {timeAgo(loc.updatedAt)}
                </span>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default BusMap;
