// Client-side validation. Mirrors the server rules in server/validators/index.js
// Each validateX() returns { fieldName: 'error message' } - empty object means valid.

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_MSG =
  'Min 8 characters with uppercase, lowercase, a number and a special character';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[A-Za-z .'-]{2,60}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const CODE_REGEX = /^[A-Za-z0-9-]{2,10}$/;
const REGNO_REGEX = /^[A-Za-z0-9/-]{1,20}$/;

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Checks each password rule separately (used by the strength checklist)
export const passwordChecks = (pw = '') => [
  { label: 'At least 8 characters', ok: pw.length >= 8 },
  { label: 'An uppercase letter', ok: /[A-Z]/.test(pw) },
  { label: 'A lowercase letter', ok: /[a-z]/.test(pw) },
  { label: 'A number', ok: /\d/.test(pw) },
  { label: 'A special character', ok: /[^A-Za-z0-9]/.test(pw) },
];

const checkName = (e, v, field = 'name', label = 'Name') => {
  if (isBlank(v)) e[field] = `${label} is required`;
  else if (!NAME_REGEX.test(v.trim())) e[field] = `${label}: 2-60 letters, spaces and . ' - only`;
};
const checkEmail = (e, v) => {
  if (isBlank(v)) e.email = 'Email is required';
  else if (!EMAIL_REGEX.test(v.trim())) e.email = 'Enter a valid email address';
};
const checkPassword = (e, v, field = 'password') => {
  if (isBlank(v)) e[field] = 'Password is required';
  else if (!PASSWORD_REGEX.test(v)) e[field] = PASSWORD_MSG;
};
const checkUserType = (e, v) => {
  if (v.role === 'User' && !['Student', 'Staff'].includes(v.userType)) e.userType = 'Select Student or Staff';
  if (v.role === 'User' && !isBlank(v.registerNo) && !REGNO_REGEX.test(v.registerNo.trim()))
    e.registerNo = 'Letters, numbers, / and - only (max 20)';
};

export const validateSignup = (v) => {
  const e = {};
  checkName(e, v.name);
  checkEmail(e, v.email);
  checkPassword(e, v.password);
  if (isBlank(v.confirmPassword)) e.confirmPassword = 'Please confirm your password';
  else if (v.confirmPassword !== v.password) e.confirmPassword = 'Passwords do not match';
  if (!['Admin', 'User'].includes(v.role)) e.role = 'Select a role';
  if (v.role === 'Admin' && isBlank(v.adminCode)) e.adminCode = 'Admin signup code is required';
  checkUserType(e, v);
  return e;
};

export const validateLogin = (v) => {
  const e = {};
  checkEmail(e, v.email);
  if (isBlank(v.password)) e.password = 'Password is required';
  return e;
};

export const validateChangePassword = (v) => {
  const e = {};
  if (isBlank(v.currentPassword)) e.currentPassword = 'Current password is required';
  checkPassword(e, v.newPassword, 'newPassword');
  if (isBlank(v.confirmNewPassword)) e.confirmNewPassword = 'Please confirm the new password';
  else if (v.confirmNewPassword !== v.newPassword) e.confirmNewPassword = 'Passwords do not match';
  if (!e.newPassword && v.newPassword === v.currentPassword)
    e.newPassword = 'New password must be different from the current password';
  return e;
};

export const validateUser = (v, isEdit) => {
  const e = {};
  checkName(e, v.name);
  checkEmail(e, v.email);
  if (!isEdit || !isBlank(v.password)) checkPassword(e, v.password);
  if (!['Admin', 'User'].includes(v.role)) e.role = 'Select a role';
  checkUserType(e, v);
  return e;
};

export const validateAnnouncement = (v) => {
  const e = {};
  if (isBlank(v.title)) e.title = 'Title is required';
  else if (v.title.trim().length < 3 || v.title.trim().length > 100) e.title = 'Title must be 3-100 characters';
  if (isBlank(v.message)) e.message = 'Message is required';
  else if (v.message.trim().length < 5 || v.message.trim().length > 500) e.message = 'Message must be 5-500 characters';
  if (!['Info', 'Warning', 'Urgent'].includes(v.severity)) e.severity = 'Choose Info, Warning or Urgent';
  if (!isBlank(v.expiresOn) && Number.isNaN(new Date(`${v.expiresOn}T00:00:00`).getTime())) e.expiresOn = 'Enter a valid date';
  return e;
};

export const validateReport = (v) => {
  const e = {};
  if (isBlank(v.category)) e.category = 'Choose what the problem is about';
  if (isBlank(v.message)) e.message = 'Please describe the problem';
  else if (v.message.trim().length < 10) e.message = 'Please write at least 10 characters';
  else if (v.message.trim().length > 600) e.message = 'Please keep it under 600 characters';
  return e;
};

export const validateIssueUpdate = (v) => {
  const e = {};
  if (!['Open', 'In progress', 'Resolved'].includes(v.status)) e.status = 'Choose a status';
  if ((v.adminNote || '').length > 300) e.adminNote = 'Reply must be at most 300 characters';
  return e;
};

export const validateBus = (v) => {
  const e = {};
  if (isBlank(v.busNumber)) e.busNumber = 'Bus number is required';
  else if (!CODE_REGEX.test(v.busNumber.trim())) e.busNumber = '2-10 letters, numbers or -';
  if (isBlank(v.registrationNo)) e.registrationNo = 'Registration number is required';
  else if (!/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{0,3}\s?\d{1,4}$/.test(v.registrationNo.trim()))
    e.registrationNo = 'Use the format TN 37 AB 1234';
  const cap = Number(v.capacity);
  if (isBlank(v.capacity)) e.capacity = 'Capacity is required';
  else if (!Number.isInteger(cap) || cap < 1 || cap > 100) e.capacity = 'Whole number between 1 and 100';
  checkName(e, v.driverName, 'driverName', 'Driver name');
  if (isBlank(v.driverPhone)) e.driverPhone = 'Driver phone is required';
  else if (!/^[6-9]\d{9}$/.test(v.driverPhone.trim())) e.driverPhone = 'Enter a valid 10-digit mobile number';
  return e;
};

export const validateRoute = (v) => {
  const e = {};
  if (isBlank(v.routeName)) e.routeName = 'Route name is required';
  else if (v.routeName.trim().length < 3) e.routeName = 'At least 3 characters';
  if (isBlank(v.routeCode)) e.routeCode = 'Route code is required';
  else if (!CODE_REGEX.test(v.routeCode.trim())) e.routeCode = '2-10 letters, numbers or -';
  if (isBlank(v.startPoint)) e.startPoint = 'Start point is required';
  const km = Number(v.distanceKm);
  if (isBlank(v.distanceKm)) e.distanceKm = 'Distance is required';
  else if (Number.isNaN(km) || km < 0.1 || km > 200) e.distanceKm = 'Between 0.1 and 200 km';
  if (!v.stops?.length) e.stops = 'Add at least one stop';
  v.stops?.forEach((s, i) => {
    if (isBlank(s.stopName)) e[`stops[${i}].stopName`] = 'Stop name required';
    if (!TIME_REGEX.test(s.pickupTime || '')) e[`stops[${i}].pickupTime`] = 'Time required';
    // Map position is optional, but if one value is given the other is needed and both must be in range
    const hasLat = !isBlank(s.lat);
    const hasLng = !isBlank(s.lng);
    if (hasLat !== hasLng) e[`stops[${i}].${hasLat ? 'lng' : 'lat'}`] = 'Enter both latitude and longitude';
    if (hasLat && !(Math.abs(Number(s.lat)) <= 90)) e[`stops[${i}].lat`] = 'Latitude must be -90 to 90';
    if (hasLng && !(Math.abs(Number(s.lng)) <= 180)) e[`stops[${i}].lng`] = 'Longitude must be -180 to 180';
  });
  return e;
};

export const validateSchedule = (v) => {
  const e = {};
  if (isBlank(v.route)) e.route = 'Select a route';
  if (isBlank(v.bus)) e.bus = 'Select a bus';
  if (!TIME_REGEX.test(v.departureTime || '')) e.departureTime = 'Departure time is required';
  if (!TIME_REGEX.test(v.arrivalTime || '')) e.arrivalTime = 'Arrival time is required';
  else if (!e.departureTime && v.arrivalTime <= v.departureTime) e.arrivalTime = 'Must be after departure time';
  if (!v.direction) e.direction = 'Select a direction';
  if (!v.shift) e.shift = 'Select a shift';
  if (!v.daysOfOperation?.length) e.daysOfOperation = 'Select at least one day';
  return e;
};
