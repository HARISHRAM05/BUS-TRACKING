import { useEffect, useState } from 'react';
import { busApi, routeApi, scheduleApi } from '../../../services/api';
import useCrudList from './useCrudList';
import useForm from '../../../utils/useForm';
import { validateSchedule } from '../../../utils/validation';
import { DAYS, formatDays, to12h } from '../../../utils/format';
import TableToolbar from './TableToolbar';
import FormModal from './FormModal';
import ConfirmModal from '../../../components/ConfirmModal';
import Loader from '../../../components/Loader';
import EmptyState from '../../../components/EmptyState';
import { TextField, SelectField } from '../../../components/FormField';

const EMPTY = {
  route: '',
  bus: '',
  departureTime: '',
  arrivalTime: '',
  direction: 'To Campus',
  shift: 'Morning',
  daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
};

const SchedulesTab = () => {
  const [shift, setShift] = useState('');
  const list = useCrudList(scheduleApi, shift ? { shift } : {});
  const form = useForm(EMPTY);
  const { values, errors, setValues, setErrors, handleChange } = form;
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    routeApi.list().then(setRoutes).catch(() => setRoutes([]));
    busApi.list().then(setBuses).catch(() => setBuses([]));
  }, []);

  const openForm = (s) => {
    form.reset(s ? { ...EMPTY, ...s, route: s.route?._id || '', bus: s.bus?._id || '' } : EMPTY);
    list.setEditing(s || {});
  };

  // Picking a route pre-selects that route's assigned bus
  const handleRouteChange = (e) => {
    handleChange(e);
    const r = routes.find((x) => x._id === e.target.value);
    if (r?.assignedBus && !values.bus) setValues((v) => ({ ...v, route: r._id, bus: r.assignedBus._id }));
  };

  const toggleDay = (day) => {
    setValues((v) => ({
      ...v,
      daysOfOperation: v.daysOfOperation.includes(day)
        ? v.daysOfOperation.filter((d) => d !== day)
        : [...v.daysOfOperation, day],
    }));
    setErrors((e) => ({ ...e, daysOfOperation: undefined }));
  };

  return (
    <>
      <TableToolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search route name/code or bus number"
        addLabel="Add schedule"
        onAdd={() => openForm(null)}
      >
        <select className="form-select" style={{ maxWidth: 180 }} value={shift} onChange={(e) => setShift(e.target.value)}>
          <option value="">All shifts</option>
          <option>Morning</option>
          <option>Evening</option>
        </select>
      </TableToolbar>

      <div className="card">
        {list.loading ? (
          <Loader />
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-calendar-week" title="No schedules found" message="Try a different search or add a new schedule." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Bus</th>
                  <th>Shift</th>
                  <th>Direction</th>
                  <th>Departs</th>
                  <th>Arrives</th>
                  <th>Days</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span className="badge bg-ku me-1">{s.route?.routeCode}</span>
                      <span className="small">{s.route?.routeName}</span>
                    </td>
                    <td>{s.bus?.busNumber}</td>
                    <td>
                      <i className={`bi ${s.shift === 'Morning' ? 'bi-sunrise text-warning' : 'bi-sunset text-danger'} me-1`} />
                      {s.shift}
                    </td>
                    <td className="small">{s.direction}</td>
                    <td>{to12h(s.departureTime)}</td>
                    <td>{to12h(s.arrivalTime)}</td>
                    <td className="small">{formatDays(s.daysOfOperation)}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openForm(s)} title="Edit">
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => list.setDeleting(s)} title="Delete">
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        show={!!list.editing}
        title={list.editing?._id ? 'Edit schedule' : 'Add schedule'}
        onClose={() => list.setEditing(null)}
        form={form}
        validate={validateSchedule}
        onSave={list.save}
      >
        <SelectField
          label="Route"
          name="route"
          value={values.route}
          onChange={handleRouteChange}
          error={errors.route}
          placeholder="Select a route"
          options={routes.map((r) => ({ value: r._id, label: `${r.routeCode} - ${r.routeName}` }))}
          required
        />
        <SelectField
          label="Bus"
          name="bus"
          value={values.bus}
          onChange={handleChange}
          error={errors.bus}
          placeholder="Select a bus"
          options={buses.map((b) => ({ value: b._id, label: `${b.busNumber} · ${b.driverName}${b.status !== 'Active' ? ` (${b.status})` : ''}` }))}
          required
        />
        <div className="row">
          <div className="col-6">
            <SelectField label="Shift" name="shift" value={values.shift} onChange={handleChange} error={errors.shift} options={['Morning', 'Evening']} required />
          </div>
          <div className="col-6">
            <SelectField label="Direction" name="direction" value={values.direction} onChange={handleChange} error={errors.direction} options={['To Campus', 'From Campus']} required />
          </div>
          <div className="col-6">
            <TextField label="Departure" name="departureTime" type="time" value={values.departureTime} onChange={handleChange} error={errors.departureTime} required />
          </div>
          <div className="col-6">
            <TextField label="Arrival" name="arrivalTime" type="time" value={values.arrivalTime} onChange={handleChange} error={errors.arrivalTime} required />
          </div>
        </div>
        <label className="form-label">
          Days of operation <span className="text-danger">*</span>
        </label>
        <div className="d-flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <div className="form-check form-check-inline me-0" key={d}>
              <input
                className={`form-check-input ${errors.daysOfOperation ? 'is-invalid' : ''}`}
                type="checkbox"
                id={`day-${d}`}
                checked={values.daysOfOperation.includes(d)}
                onChange={() => toggleDay(d)}
              />
              <label className="form-check-label" htmlFor={`day-${d}`}>{d}</label>
            </div>
          ))}
        </div>
        {errors.daysOfOperation && <div className="text-danger small mt-1">{errors.daysOfOperation}</div>}
      </FormModal>

      <ConfirmModal
        show={!!list.deleting}
        message={
          <>
            Delete the <strong>{list.deleting?.shift?.toLowerCase()}</strong> schedule for{' '}
            <strong>{list.deleting?.route?.routeCode}</strong> departing at {to12h(list.deleting?.departureTime)}?
          </>
        }
        busy={list.busy}
        onConfirm={list.confirmDelete}
        onClose={() => list.setDeleting(null)}
      />
    </>
  );
};

export default SchedulesTab;
