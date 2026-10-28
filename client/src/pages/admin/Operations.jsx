// Consolidated Operations page: Buses / Routes / Schedules tabs (tab kept in the URL ?tab=)
import { useSearchParams } from 'react-router-dom';
import BusesTab from './operations/BusesTab';
import RoutesTab from './operations/RoutesTab';
import SchedulesTab from './operations/SchedulesTab';
import AnnouncementsTab from './operations/AnnouncementsTab';
import ReportsTab from './operations/ReportsTab';

const TABS = [
  { key: 'buses', label: 'Buses', icon: 'bi-bus-front', Component: BusesTab },
  { key: 'routes', label: 'Routes', icon: 'bi-signpost-split', Component: RoutesTab },
  { key: 'schedules', label: 'Schedules', icon: 'bi-calendar-week', Component: SchedulesTab },
  { key: 'announcements', label: 'Announcements', icon: 'bi-megaphone', Component: AnnouncementsTab },
  { key: 'reports', label: 'Reports', icon: 'bi-flag', Component: ReportsTab },
];

const Operations = () => {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.key === params.get('tab')) || TABS[0];
  const { Component } = active;

  return (
    <div className="container py-4">
      <h1 className="h3 fw-bold text-ku mb-1">Operations</h1>
      <p className="text-muted">Manage buses, routes and schedules, post notices to riders, and answer their reports.</p>

      <ul className="nav nav-tabs mb-3">
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link ${t.key === active.key ? 'active fw-semibold' : ''}`}
              onClick={() => setParams({ tab: t.key })}
            >
              <i className={`bi ${t.icon} me-1`} />
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      <Component />
    </div>
  );
};

export default Operations;
