// Map / tracking suite: stop coordinates, simulated (demo) bus positions, GPS updates.
module.exports = async ({ req, login, sleep, check }) => {
  const admin = await login('admin@karunya.edu.in', 'Admin@123');
  const student = await login('student@karunya.edu.in', 'Student@123');

  let r = await req('GET', '/tracking');
  check('tracking needs login 401', r.s === 401);
  r = await req('GET', '/tracking', null, student);
  check('student reads tracking 200 (7 routes)', r.s === 200 && r.j.data.length === 7, r.j.data?.length);
  const withBus = r.j.data.filter((x) => x.assignedBus);
  check('6 routes have a bus', withBus.length === 6);
  check('every stop has lat/lng', r.j.data.every((x) => x.stops.every((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))));
  check(
    'last stop of every route is the campus',
    r.j.data.every((x) => {
      const last = x.stops[x.stops.length - 1];
      return Math.abs(last.lat - 10.9358) < 0.001 && Math.abs(last.lng - 76.7437) < 0.001;
    })
  );
  check(
    'buses have simulated locations',
    withBus.every((x) => x.assignedBus.location?.source === 'simulated' && Number.isFinite(x.assignedBus.location.lat))
  );
  const sample = withBus[0];
  const pos1 = sample.assignedBus.location;
  const lats = withBus.map((x) => x.assignedBus.location.lat.toFixed(3));
  check('buses are spread out (different positions)', new Set(lats).size > 3, lats.join());

  await sleep(6000);
  r = await req('GET', '/tracking', null, student);
  const pos2 = r.j.data.find((x) => x._id === sample._id).assignedBus.location;
  check('bus position changes over time', pos1.lat !== pos2.lat || pos1.lng !== pos2.lng, JSON.stringify([pos1, pos2]));

  r = await req('GET', '/routes/' + sample._id, null, student);
  check('route detail includes bus location', r.s === 200 && Number.isFinite(r.j.data.assignedBus.location.lat));

  // ---------- GPS position updates (admin only) ----------
  const busId = sample.assignedBus._id;
  r = await req('PUT', `/buses/${busId}/location`, { lat: 11.0, lng: 76.9 }, student);
  check('student cannot set location 403', r.s === 403);
  r = await req('PUT', `/buses/${busId}/location`, { lat: 95, lng: 'x' }, admin);
  check('bad location 422', r.s === 422 && r.j.errors.lat && r.j.errors.lng, JSON.stringify(r.j));
  r = await req('PUT', `/buses/${busId}/location`, { lat: 11.0123, lng: 76.9876 }, admin);
  check('admin sets location 200 (source gps)', r.s === 200 && r.j.data.location.source === 'gps' && r.j.data.location.lat === 11.0123);
  await sleep(6000);
  r = await req('GET', '/tracking', null, student);
  const after = r.j.data.find((x) => x._id === sample._id).assignedBus.location;
  check('a fresh GPS position overrides the simulation', after.source === 'gps' && after.lat === 11.0123, JSON.stringify(after));

  // ---------- Stop coordinates on routes ----------
  const body = {
    routeName: 'Map Test', routeCode: 'RMAP', startPoint: 'A', distanceKm: 5,
    stops: [{ stopName: 'S1', pickupTime: '07:00', order: 1, lat: 11.01, lng: 76.95 }, { stopName: 'S2', pickupTime: '07:20', order: 2 }],
  };
  r = await req('POST', '/routes', body, admin);
  check(
    'route with partial coordinates 201',
    r.s === 201 && r.j.data.stops[0].lat === 11.01 && r.j.data.stops[1].lat === undefined,
    JSON.stringify(r.j.data?.stops)
  );
  const id = r.j.data._id;
  r = await req('POST', '/routes', { ...body, routeCode: 'RMAP2', stops: [{ stopName: 'S1', pickupTime: '07:00', order: 1, lat: 200, lng: 76.9 }] }, admin);
  check('out-of-range latitude 422', r.s === 422 && r.j.errors['stops[0].lat'], JSON.stringify(r.j));
  r = await req('DELETE', '/routes/' + id, null, admin);
  check('cleanup test route 200', r.s === 200);
};
