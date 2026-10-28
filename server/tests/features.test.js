// Rider features: next-bus calculation, My Route, announcements, rider reports.
const { nextDepartures } = require('../services/nextBus');

module.exports = async ({ req, login, check }) => {
  // ---------- Next-bus calculation (pure function, fixed IST clock times) ----------
  const route = {
    stops: [
      { stopName: 'Gandhipuram', pickupTime: '06:45', order: 1 },
      { stopName: 'Ukkadam', pickupTime: '07:05', order: 2 },
      { stopName: 'Karunya Nagar Campus', pickupTime: '08:05', order: 3 },
    ],
  };
  const bus = { busNumber: 'KU-01', driverName: 'Test Driver' };
  const schedules = [
    { departureTime: '06:45', direction: 'To Campus', shift: 'Morning', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], bus },
    { departureTime: '16:45', direction: 'From Campus', shift: 'Evening', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], bus },
  ];
  const at = (iso) => new Date(iso); // ISO strings carry the +05:30 offset, so the test is time-zone independent

  // Monday 06:50 IST -> morning bus at Ukkadam is 07:05 (15 min), evening one 16:45 + 60 min = 17:45
  let d = nextDepartures({ route, schedules, stopName: 'Ukkadam', now: at('2026-10-26T06:50:00+05:30') });
  check('next bus: morning pickup in 15 minutes', d[0].time === '07:05' && d[0].minutesUntil === 15 && d[0].dayLabel === 'Today', JSON.stringify(d[0]));
  check('next bus: evening bus reaches the stop 60 min after leaving campus', d[1].time === '17:45' && d[1].minutesUntil === 655 && d[1].direction === 'From Campus', JSON.stringify(d[1]));
  check('next bus: results are sorted soonest first', d.every((x, i) => i === 0 || d[i - 1].minutesUntil <= x.minutesUntil));

  // Monday 07:30 IST -> the morning bus has gone, so the evening bus is next
  d = nextDepartures({ route, schedules, stopName: 'ukkadam', now: at('2026-10-26T07:30:00+05:30') });
  check('next bus: skips a bus that already passed (stop name is case-insensitive)', d[0].time === '17:45' && d[0].dayLabel === 'Today');
  check('next bus: then tomorrow morning', d[1].dayLabel === 'Tomorrow' && d[1].time === '07:05');

  // Saturday 20:00 IST -> no weekend service, next is Monday 07:05 (35 h 05 min away)
  d = nextDepartures({ route, schedules, stopName: 'Ukkadam', now: at('2026-10-31T20:00:00+05:30') });
  check('next bus: weekend jumps to Monday morning', d[0].dayLabel === 'Mon' && d[0].time === '07:05' && d[0].minutesUntil === 2105, JSON.stringify(d[0]));

  // The clock is read in IST even when it is a different day in UTC: Mon 00:30 IST is still Sun in UTC
  d = nextDepartures({ route, schedules, stopName: 'Ukkadam', now: at('2026-10-26T00:30:00+05:30') });
  check('next bus: uses IST, not UTC, for "today"', d[0].dayLabel === 'Today' && d[0].time === '07:05' && d[0].minutesUntil === 395, JSON.stringify(d[0]));

  check('next bus: unknown stop returns null', nextDepartures({ route, schedules, stopName: 'Nowhere', now: new Date() }) === null);

  // ---------- Set up users and data ----------
  const admin = await login('admin@karunya.edu.in', 'Admin@123');
  const student = await login('student@karunya.edu.in', 'Student@123');
  const staff = await login('staff@karunya.edu.in', 'Staff@1234');

  let r = await req('GET', '/routes', null, student);
  const gandhipuram = r.j.data.find((x) => x.routeCode === 'R01');

  // ---------- My Route ----------
  r = await req('GET', '/me/next-bus', null, student);
  check('my route: nothing saved yet returns null', r.s === 200 && r.j.data === null);
  r = await req('PUT', '/me/route', { routeId: gandhipuram._id, stopName: 'Nowhere Stop' }, student);
  check('my route: stop not on the route 422', r.s === 422 && r.j.errors.stopName);
  r = await req('PUT', '/me/route', { routeId: '123', stopName: '' }, student);
  check('my route: bad input 422', r.s === 422 && r.j.errors.routeId && r.j.errors.stopName);
  r = await req('PUT', '/me/route', { routeId: '64b000000000000000000000', stopName: 'Ukkadam' }, student);
  check('my route: unknown route 404', r.s === 404);
  r = await req('PUT', '/me/route', { routeId: gandhipuram._id, stopName: 'ukkadam' }, student);
  check('my route: saved (stop name tidied to its real spelling)', r.s === 200 && r.j.data.myStop === 'Ukkadam' && r.j.data.myRoute === gandhipuram._id, JSON.stringify(r.j));
  r = await req('GET', '/auth/me', null, student);
  check('my route: shown on the profile', r.j.data.myStop === 'Ukkadam');

  r = await req('GET', '/me/next-bus', null, student);
  const nb = r.j.data;
  check('next bus: has route, stop and upcoming buses', r.s === 200 && nb.route.routeCode === 'R01' && nb.stopName === 'Ukkadam' && nb.departures.length >= 2, JSON.stringify(nb));
  check('next bus: every departure has time, countdown and bus', nb.departures.every((x) => /^\d\d:\d\d$/.test(x.time) && Number.isFinite(x.minutesUntil) && x.bus?.busNumber === 'KU-01'));
  check('next bus: tells how far the bus is from the stop', nb.live && nb.live.busNumber === 'KU-01' && nb.live.distanceKm >= 0 && nb.live.source, JSON.stringify(nb.live));

  r = await req('GET', '/me/next-bus', null, staff);
  check('next bus: another rider is not affected', r.j.data === null);

  // ---------- Announcements ----------
  const base = { title: 'Heavy rain today', message: 'Buses may run 15 minutes late.', severity: 'Warning' };
  r = await req('POST', '/announcements', base, student);
  check('announcement: student cannot post 403', r.s === 403);
  r = await req('POST', '/announcements', { title: 'x', message: 'hi', severity: 'Loud', expiresAt: 'not-a-date' }, admin);
  check('announcement: validation 422', r.s === 422 && r.j.errors.title && r.j.errors.message && r.j.errors.severity && r.j.errors.expiresAt, JSON.stringify(r.j));
  r = await req('POST', '/announcements', { ...base, route: '64b000000000000000000000' }, admin);
  check('announcement: unknown route 422', r.s === 422 && r.j.errors.route);

  r = await req('POST', '/announcements', base, admin);
  check('announcement: admin posts for everyone 201', r.s === 201 && r.j.data.route === null);
  const forAll = r.j.data._id;
  r = await req('POST', '/announcements', { ...base, title: 'R01 diversion', severity: 'Urgent', route: gandhipuram._id }, admin);
  check('announcement: admin posts for one route 201', r.s === 201 && r.j.data.route.routeCode === 'R01');
  const forR01 = r.j.data._id;
  r = await req('POST', '/announcements', { ...base, title: 'Old notice', expiresAt: '2020-01-01T00:00:00Z' }, admin);
  const expired = r.j.data._id;

  r = await req('GET', '/announcements', null, student);
  const titles = r.j.data.map((x) => x.title);
  check('announcement: riders see active ones only', titles.includes('Heavy rain today') && titles.includes('R01 diversion') && !titles.includes('Old notice'), titles.join());
  check('announcement: Urgent comes before Warning', r.j.data.findIndex((x) => x.severity === 'Urgent') < r.j.data.findIndex((x) => x.title === 'Heavy rain today'));
  r = await req('GET', '/announcements?all=true', null, student);
  check('announcement: a rider cannot ask for expired ones', !r.j.data.some((x) => x.title === 'Old notice'));
  r = await req('GET', '/announcements?all=true', null, admin);
  check('announcement: admin can see expired ones', r.j.data.some((x) => x.title === 'Old notice'));

  const other = (await req('GET', '/routes', null, student)).j.data.find((x) => x.routeCode === 'R05');
  r = await req('GET', `/announcements?route=${other._id}`, null, student);
  check('announcement: route filter keeps general notices, drops other routes', r.j.data.some((x) => x.title === 'Heavy rain today') && !r.j.data.some((x) => x.title === 'R01 diversion'));
  r = await req('GET', `/announcements?route=${gandhipuram._id}`, null, student);
  check('announcement: route filter includes that route\'s notice', r.j.data.some((x) => x.title === 'R01 diversion'));

  r = await req('PUT', '/announcements/' + forAll, { ...base, message: 'Updated: buses may run 20 minutes late.' }, admin);
  check('announcement: update 200', r.s === 200 && /20 minutes/.test(r.j.data.message));
  r = await req('DELETE', '/announcements/' + expired, null, admin);
  check('announcement: delete 200', r.s === 200);
  r = await req('DELETE', '/announcements/' + forAll, null, student);
  check('announcement: student cannot delete 403', r.s === 403);

  // ---------- Rider reports ----------
  const report = { category: 'Bus late', route: gandhipuram._id, message: 'The 7:05 bus came 20 minutes late today.' };
  r = await req('POST', '/issues', { category: 'Nonsense', message: 'short' }, student);
  check('report: validation 422', r.s === 422 && r.j.errors.category && r.j.errors.message, JSON.stringify(r.j));
  r = await req('POST', '/issues', report);
  check('report: needs login 401', r.s === 401);
  r = await req('POST', '/issues', report, student);
  check('report: student sends 201', r.s === 201 && r.j.data.status === 'Open' && r.j.data.route.routeCode === 'R01');
  const issueId = r.j.data._id;
  await req('POST', '/issues', { category: 'Lost item', message: 'I left a blue umbrella in bus KU-03.' }, staff);

  r = await req('GET', '/issues/mine', null, student);
  check('report: rider sees only their own', r.s === 200 && r.j.data.length === 1 && r.j.data[0]._id === issueId);
  r = await req('GET', '/issues', null, student);
  check('report: student cannot open the inbox 403', r.s === 403);
  r = await req('GET', '/issues?status=Open', null, admin);
  check('report: admin inbox shows who reported', r.s === 200 && r.j.data.length >= 2 && r.j.data.every((x) => x.user?.name && x.user?.email), JSON.stringify(r.j.data[0]?.user));
  r = await req('GET', '/issues?category=Lost%20item', null, admin);
  check('report: inbox category filter', r.j.data.length === 1 && r.j.data[0].category === 'Lost item');
  r = await req('GET', '/issues?status=Done', null, admin);
  check('report: bad filter 422', r.s === 422);

  r = await req('PUT', '/issues/' + issueId, { status: 'Resolved', adminNote: 'Driver was stuck in traffic; we have spoken to him.' }, student);
  check('report: student cannot update 403', r.s === 403);
  r = await req('PUT', '/issues/' + issueId, { status: 'Resolved', adminNote: 'Driver was stuck in traffic; we have spoken to him.' }, admin);
  check('report: admin resolves with a reply 200', r.s === 200 && r.j.data.status === 'Resolved');
  r = await req('GET', '/issues/mine', null, student);
  check('report: rider sees the status and reply', r.j.data[0].status === 'Resolved' && /traffic/.test(r.j.data[0].adminNote));

  // one account cannot flood the inbox
  let blocked;
  for (let i = 0; i < 12 && !blocked; i += 1) {
    const x = await req('POST', '/issues', { category: 'Other', message: `Spam report number ${i} for testing.` }, student);
    if (x.s === 409) blocked = x;
  }
  check('report: unresolved reports are capped at 10 per rider', !!blocked, 'never blocked');

  // ---------- Dashboard numbers ----------
  r = await req('GET', '/stats', null, admin);
  check('stats: open reports and announcements counted', r.s === 200 && r.j.data.openReports >= 10 && r.j.data.announcements >= 2, JSON.stringify(r.j.data));

  // ---------- Deleting a route cleans up after itself ----------
  r = await req('POST', '/routes', {
    routeName: 'Cleanup Test', routeCode: 'RCLN', startPoint: 'A', distanceKm: 3,
    stops: [{ stopName: 'Alpha', pickupTime: '07:00', order: 1 }, { stopName: 'Beta', pickupTime: '07:15', order: 2 }],
  }, admin);
  const tmp = r.j.data._id;
  await req('PUT', '/me/route', { routeId: tmp, stopName: 'Alpha' }, staff);
  await req('POST', '/announcements', { ...base, title: 'Cleanup notice', route: tmp }, admin);
  await req('DELETE', '/routes/' + tmp, null, admin);
  r = await req('GET', '/me/next-bus', null, staff);
  check('delete route: riders\' saved route is cleared', r.j.data === null);
  r = await req('GET', '/announcements?all=true', null, admin);
  check('delete route: its announcements are removed', !r.j.data.some((x) => x.title === 'Cleanup notice'));
};
