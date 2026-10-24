// Core API suite: auth, validation, role protection, CRUD for buses/routes/schedules/users, dashboard.
// Expects a freshly seeded database (the runner does that).
module.exports = async ({ req, login, check }) => {
  const ADMIN_CODE = process.env.ADMIN_SIGNUP_CODE;

  const r0 = await req('GET', '/health');
  check('health 200', r0.s === 200);

  // ---------- Auth ----------
  let r = await req('POST', '/auth/login', { email: 'admin@karunya.edu.in', password: 'Admin@123' });
  check('admin login 200', r.s === 200 && r.j.data.token);
  check('no password in login response', !JSON.stringify(r.j).includes('password'));
  const admin = r.j.data.token;
  const adminId = r.j.data.user._id;

  r = await req('POST', '/auth/login', { email: 'student@karunya.edu.in', password: 'Student@123' });
  check('student login 200', r.s === 200 && r.j.data.user.role === 'User');
  const student = r.j.data.token;

  r = await req('POST', '/auth/login', { email: 'admin@karunya.edu.in', password: 'wrong' });
  check('bad password 401', r.s === 401);

  r = await req('POST', '/auth/signup', { name: 'T', email: 'bad', password: 'weak', confirmPassword: 'x', role: 'User' });
  check(
    'signup validation 422 with field errors',
    r.s === 422 && r.j.errors.email && r.j.errors.password && r.j.errors.confirmPassword && r.j.errors.name,
    JSON.stringify(r.j)
  );

  const adminSignup = { name: 'New Admin', email: 'na@karunya.edu.in', password: 'Strong@123', confirmPassword: 'Strong@123', role: 'Admin' };
  r = await req('POST', '/auth/signup', { ...adminSignup, adminCode: 'nope' });
  check('admin signup wrong code 422', r.s === 422 && r.j.errors.adminCode);
  r = await req('POST', '/auth/signup', { ...adminSignup, adminCode: ADMIN_CODE });
  check('admin signup correct code 201', r.s === 201 && r.j.data.user.role === 'Admin');

  const studentSignup = {
    name: 'Kavya S', email: 'kavya@karunya.edu.in', password: 'Strong@123', confirmPassword: 'Strong@123',
    role: 'User', userType: 'Student', registerNo: 'URK24EC2002',
  };
  r = await req('POST', '/auth/signup', studentSignup);
  check('student signup 201', r.s === 201 && r.j.data.user.userType === 'Student');
  const kavya = r.j.data.token;
  const kavyaId = r.j.data.user._id;

  r = await req('POST', '/auth/signup', studentSignup);
  check('duplicate email 409', r.s === 409 && r.j.errors.email);

  r = await req('GET', '/auth/me', null, kavya);
  check('me 200', r.s === 200 && r.j.data.email === 'kavya@karunya.edu.in');
  r = await req('GET', '/auth/me');
  check('me without token 401', r.s === 401);

  r = await req('PUT', '/auth/change-password', { currentPassword: 'Wrong@123', newPassword: 'Newer@1234', confirmNewPassword: 'Newer@1234' }, kavya);
  check('change password wrong current 400', r.s === 400 && r.j.errors.currentPassword);
  r = await req('PUT', '/auth/change-password', { currentPassword: 'Strong@123', newPassword: 'Newer@1234', confirmNewPassword: 'Newer@1234' }, kavya);
  check('change password 200', r.s === 200);
  r = await req('POST', '/auth/login', { email: 'kavya@karunya.edu.in', password: 'Newer@1234' });
  check('login with new password 200', r.s === 200);

  // ---------- Reads for logged-in users ----------
  r = await req('GET', '/buses', null, student);
  check('student reads buses (6)', r.s === 200 && r.j.data.length === 6, r.j.data?.length);
  r = await req('GET', '/routes', null, student);
  check('student reads routes (7)', r.s === 200 && r.j.data.length === 7);
  const routeId = r.j.data[0]._id;
  r = await req('GET', '/routes?stop=ukkadam', null, student);
  check(
    'route filter by stop',
    r.s === 200 && r.j.data.length >= 3 && r.j.data.every((x) => x.stops.some((s) => /ukkadam/i.test(s.stopName)))
  );
  r = await req('GET', '/routes?bus=KU-03', null, student);
  check('route filter by bus', r.s === 200 && r.j.data.length === 1 && r.j.data[0].assignedBus.busNumber === 'KU-03');
  r = await req('GET', '/routes/' + routeId, null, student);
  check('route detail with schedules', r.s === 200 && r.j.data.schedules.length === 2 && r.j.data.assignedBus.driverName);
  r = await req('GET', '/schedules?shift=Evening&direction=From%20Campus&day=Sat', null, student);
  check(
    'schedule filters (shift, direction, day)',
    r.s === 200 && r.j.data.length > 0 && r.j.data.every((s) => s.shift === 'Evening' && s.daysOfOperation.includes('Sat'))
  );
  r = await req('GET', '/schedules?stop=alandurai', null, student);
  check('schedule filter by stop', r.s === 200 && r.j.data.length === 4, r.j.data?.length);
  r = await req('GET', '/schedules?shift=Night', null, student);
  check('invalid query value 422', r.s === 422);

  // ---------- Role protection: User writes are 403 ----------
  r = await req('POST', '/buses', { busNumber: 'X1' }, student);
  check('student POST bus 403', r.s === 403);
  r = await req('DELETE', '/routes/' + routeId, null, student);
  check('student DELETE route 403', r.s === 403);
  r = await req('PUT', '/schedules/' + routeId, {}, student);
  check('student PUT schedule 403', r.s === 403);
  r = await req('GET', '/users', null, student);
  check('student GET users 403', r.s === 403);
  r = await req('GET', '/stats', null, student);
  check('student GET stats 403', r.s === 403);

  // ---------- Admin CRUD: buses ----------
  r = await req('POST', '/buses', { busNumber: 'KU-09', registrationNo: 'XX', capacity: 500, driverName: '1', driverPhone: '123' }, admin);
  check(
    'bus validation 422',
    r.s === 422 && r.j.errors.registrationNo && r.j.errors.capacity && r.j.errors.driverPhone && r.j.errors.driverName
  );
  const busBody = { busNumber: 'ku-09', registrationNo: 'TN 37 KU 1009', capacity: 45, driverName: 'Test Driver', driverPhone: '9000000109' };
  r = await req('POST', '/buses', busBody, admin);
  check('create bus 201 (number uppercased)', r.s === 201 && r.j.data.busNumber === 'KU-09');
  const busId = r.j.data._id;
  r = await req('POST', '/buses', busBody, admin);
  check('duplicate bus number 409', r.s === 409);
  r = await req('PUT', '/buses/' + busId, { ...busBody, status: 'Maintenance' }, admin);
  check('update bus 200', r.s === 200 && r.j.data.status === 'Maintenance');
  r = await req('GET', '/buses/123', null, admin);
  check('bad id 422', r.s === 422);

  // ---------- Admin CRUD: routes ----------
  const routeBody = {
    routeName: 'Vadavalli - Karunya', routeCode: 'R08', startPoint: 'Vadavalli', distanceKm: 22, assignedBus: busId,
    stops: [{ stopName: 'Vadavalli', pickupTime: '07:10', order: 2 }, { stopName: 'PN Pudur', pickupTime: '07:00', order: 1 }],
  };
  r = await req('POST', '/routes', { ...routeBody, stops: [{ stopName: '', pickupTime: '25:00', order: 1 }] }, admin);
  check(
    'route stop validation 422',
    r.s === 422 && r.j.errors['stops[0].stopName'] && r.j.errors['stops[0].pickupTime'],
    JSON.stringify(r.j.errors)
  );
  r = await req('POST', '/routes', routeBody, admin);
  check(
    'create route 201 (stops sorted, campus endpoint)',
    r.s === 201 && r.j.data.stops[0].stopName === 'PN Pudur' && r.j.data.endPoint === 'Karunya Nagar Campus'
  );
  const newRouteId = r.j.data._id;
  r = await req('PUT', '/routes/' + newRouteId, { ...routeBody, routeName: 'Vadavalli Express' }, admin);
  check('update route 200', r.s === 200 && r.j.data.routeName === 'Vadavalli Express');

  // ---------- Admin CRUD: schedules ----------
  const schBody = { route: newRouteId, bus: busId, departureTime: '07:00', arrivalTime: '07:45', direction: 'To Campus', shift: 'Morning', daysOfOperation: ['Mon', 'Wed'] };
  r = await req('POST', '/schedules', { ...schBody, arrivalTime: '06:00', daysOfOperation: [] }, admin);
  check('schedule validation 422', r.s === 422 && r.j.errors.arrivalTime && r.j.errors.daysOfOperation);
  r = await req('POST', '/schedules', schBody, admin);
  check('create schedule 201', r.s === 201 && r.j.data.route.routeCode === 'R08');
  const schId = r.j.data._id;
  r = await req('PUT', '/schedules/' + schId, { ...schBody, departureTime: '07:05' }, admin);
  check('update schedule 200', r.s === 200 && r.j.data.departureTime === '07:05');
  r = await req('DELETE', '/buses/' + busId, null, admin);
  check('delete bus used by a schedule 409', r.s === 409);
  r = await req('DELETE', '/schedules/' + schId, null, admin);
  check('delete schedule 200', r.s === 200);
  await req('POST', '/schedules', schBody, admin);
  r = await req('DELETE', '/routes/' + newRouteId, null, admin);
  check('delete route also deletes its schedules', r.s === 200 && /1 schedule/.test(r.j.message), r.j.message);
  r = await req('DELETE', '/buses/' + busId, null, admin);
  check('delete bus 200', r.s === 200);

  // ---------- Admin: users ----------
  r = await req('GET', '/users?role=User', null, admin);
  check('list users (no password field)', r.s === 200 && r.j.data.every((u) => u.role === 'User' && !('password' in u)));
  const userBody = { name: 'Staff Two', email: 'staff2@karunya.edu.in', role: 'User', userType: 'Staff', registerNo: 'KITS-STF-0500' };
  r = await req('POST', '/users', { ...userBody, password: 'weak' }, admin);
  check('create user weak password 422', r.s === 422 && r.j.errors.password);
  r = await req('POST', '/users', { ...userBody, password: 'Staff@9999' }, admin);
  check('create user 201', r.s === 201);
  const staff2 = r.j.data._id;
  r = await req('PUT', '/users/' + staff2, { ...userBody, status: 'inactive' }, admin);
  check('deactivate user 200', r.s === 200 && r.j.data.status === 'inactive');
  r = await req('POST', '/auth/login', { email: 'staff2@karunya.edu.in', password: 'Staff@9999' });
  check('inactive user cannot log in 403', r.s === 403);
  r = await req('PUT', '/users/' + adminId, { name: 'Transport Office Admin', email: 'admin@karunya.edu.in', role: 'User', userType: 'Staff', status: 'active' }, admin);
  check('admin cannot demote self 400', r.s === 400);
  r = await req('DELETE', '/users/' + adminId, null, admin);
  check('admin cannot delete self 400', r.s === 400);
  r = await req('DELETE', '/users/' + staff2, null, admin);
  check('delete user 200', r.s === 200);
  r = await req('DELETE', '/users/' + kavyaId, null, admin);
  check('delete signed-up user 200', r.s === 200);

  // ---------- Dashboard ----------
  r = await req('GET', '/stats', null, admin);
  check('stats', r.s === 200 && r.j.data.buses === 6 && r.j.data.routes === 7 && r.j.data.schedules === 12, JSON.stringify(r.j.data));
  r = await req('GET', '/activity?limit=5', null, admin);
  check('activity log (newest first)', r.s === 200 && r.j.data.length === 5 && /Removed user/.test(r.j.data[0].action), r.j.data?.[0]?.action);
  r = await req('GET', '/nope', null, admin);
  check('unknown route 404 in JSON', r.s === 404 && r.j.success === false);
};
