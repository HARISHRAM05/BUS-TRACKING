// Notices from the Transport Office. Urgent ones come first. Riders can dismiss a notice for this browser session.
// With `routeId`, shows notices for everyone plus notices for that route; without it, every active notice.
import { useEffect, useState } from 'react';
import { announcementApi } from '../services/api';
import { SEVERITY_STYLE, timeAgo } from '../utils/format';

const KEY = 'kbtp_dismissed_notices';

const readDismissed = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]');
  } catch (e) {
    return [];
  }
};

const AnnouncementBanner = ({ routeId }) => {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    let active = true;
    const load = () =>
      announcementApi
        .list(routeId ? { route: routeId } : undefined)
        .then((list) => active && setItems(list))
        .catch(() => {}); // a notice banner should never break the page
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [routeId]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      /* private mode: dismissal just lasts until the page reloads */
    }
  };

  const visible = items.filter((a) => !dismissed.includes(a._id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-3">
      {visible.map((a) => {
        const style = SEVERITY_STYLE[a.severity];
        return (
          <div key={a._id} className={`alert ${style.alert} d-flex gap-2 align-items-start py-2 mb-2`} role="alert">
            <i className={`bi ${style.icon} mt-1`} />
            <div className="flex-grow-1">
              <strong>{a.title}</strong>
              {a.route && <span className="badge bg-ku ms-2">{a.route.routeCode}</span>}
              <div className="small">{a.message}</div>
              <div className="small opacity-75">Transport Office · {timeAgo(a.createdAt)}</div>
            </div>
            <button type="button" className="btn-close" aria-label="Dismiss notice" onClick={() => dismiss(a._id)} />
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
