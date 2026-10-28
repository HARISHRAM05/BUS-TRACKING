// Display helpers

// "16:45" -> "4:45 PM"
export const to12h = (time) => {
  if (!time) return '-';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ['Mon','Tue','Wed','Thu','Fri'] -> "Mon - Fri"
export const formatDays = (days = []) => {
  const sorted = DAYS.filter((d) => days.includes(d));
  const idx = sorted.map((d) => DAYS.indexOf(d));
  const consecutive = idx.length > 2 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  return consecutive ? `${sorted[0]} - ${sorted[sorted.length - 1]}` : sorted.join(', ');
};

export const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// "in 12 min" / "in 2 h 5 min"; null when it is a day or more away (show the day name instead)
export const countdownText = (minutes) => {
  if (minutes <= 0) return 'due now';
  if (minutes < 60) return `in ${minutes} min`;
  if (minutes < 1440) return `in ${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  return null;
};

// Announcement expiry is picked as a calendar date (India time) and stored as the end of that day
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const toIstDateInput = (iso) =>
  iso ? new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10) : '';
export const istEndOfDay = (dateStr) => (dateStr ? new Date(`${dateStr}T23:59:00+05:30`).toISOString() : null);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const SEVERITY_STYLE = {
  Info: { alert: 'alert-info', badge: 'text-bg-info', icon: 'bi-info-circle-fill' },
  Warning: { alert: 'alert-warning', badge: 'text-bg-warning', icon: 'bi-exclamation-triangle-fill' },
  Urgent: { alert: 'alert-danger', badge: 'text-bg-danger', icon: 'bi-exclamation-octagon-fill' },
};

export const ISSUE_CATEGORIES = ['Bus late', 'Overcrowded', 'Breakdown', 'Driver behaviour', 'Safety concern', 'Lost item', 'Other'];
export const ISSUE_STATUSES = ['Open', 'In progress', 'Resolved'];
export const ISSUE_STATUS_BADGE = { Open: 'text-bg-danger', 'In progress': 'text-bg-warning', Resolved: 'text-bg-success' };

export const BUS_STATUS_BADGE = {
  Active: 'text-bg-success',
  Maintenance: 'text-bg-warning',
  Inactive: 'text-bg-secondary',
};
