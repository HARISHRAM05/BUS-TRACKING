/**
 * "When does my bus reach my stop?"
 *
 * The timetable stores the MORNING pickup time at every stop of a route, and each schedule (trip) stores
 * the time the bus leaves the first stop (To Campus) or the campus (From Campus). From that we work out the
 * time the bus passes any stop on any trip:
 *
 *   To Campus   : trip departure + (stop pickup time - first stop pickup time)
 *   From Campus : trip departure + (campus arrival time - stop pickup time)    <- same road, reversed (estimate)
 *
 * All clock times are Indian Standard Time, whatever time zone the server runs in (Vercel runs in UTC).
 */
const TZ = 'Asia/Kolkata';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // same labels as Schedule.daysOfOperation

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// Day label ('Mon'..'Sun') and minutes since midnight, in IST, for a Date
const istParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return { day: get('weekday'), minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
};

// Minutes-of-day at which a trip passes `stop`, or null if it can't be worked out
const stopTime = (route, schedule, stop) => {
  const stops = [...route.stops].sort((a, b) => a.order - b.order);
  const first = stops[0];
  const last = stops[stops.length - 1];
  const departure = toMinutes(schedule.departureTime);

  return schedule.direction === 'To Campus'
    ? departure + (toMinutes(stop.pickupTime) - toMinutes(first.pickupTime))
    : departure + (toMinutes(last.pickupTime) - toMinutes(stop.pickupTime));
};

/**
 * Upcoming passes of `stopName` on `route`, soonest first.
 * Returns null when the stop is not on the route (e.g. the admin renamed it).
 */
const nextDepartures = ({ route, schedules, stopName, now = new Date(), limit = 4, lookaheadDays = 7 }) => {
  const stop = route.stops.find((s) => s.stopName.toLowerCase() === String(stopName).toLowerCase());
  if (!stop || route.stops.length === 0) return null;

  const today = istParts(now);
  const todayIndex = DAYS.indexOf(today.day);
  const found = [];

  for (let offset = 0; offset < lookaheadDays; offset += 1) {
    const day = DAYS[(todayIndex + offset) % 7];
    for (const schedule of schedules) {
      if (!schedule.daysOfOperation.includes(day)) continue;
      const t = stopTime(route, schedule, stop);
      if (offset === 0 && t <= today.minutes) continue; // already gone today
      found.push({
        dayOffset: offset,
        dayLabel: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : day,
        time: toHHMM(t),
        minutesUntil: offset * 1440 + t - today.minutes,
        direction: schedule.direction,
        shift: schedule.shift,
        bus: schedule.bus
          ? { busNumber: schedule.bus.busNumber, driverName: schedule.bus.driverName }
          : null,
      });
    }
  }

  return found.sort((a, b) => a.minutesUntil - b.minutesUntil).slice(0, limit);
};

module.exports = { nextDepartures, istParts, toHHMM, toMinutes };
