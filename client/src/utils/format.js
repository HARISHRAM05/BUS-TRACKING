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

export const BUS_STATUS_BADGE = {
  Active: 'text-bg-success',
  Maintenance: 'text-bg-warning',
  Inactive: 'text-bg-secondary',
};
