import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { busApi, routeApi } from '../../../services/api';
import useCrudList from './useCrudList';
import useForm from '../../../utils/useForm';
import { validateRoute } from '../../../utils/validation';
import { to12h } from '../../../utils/format';
import TableToolbar from './TableToolbar';
import FormModal from './FormModal';
import ConfirmModal from '../../../components/ConfirmModal';
import Loader from '../../../components/Loader';
import EmptyState from '../../../components/EmptyState';
import { TextField, SelectField } from '../../../components/FormField';

const CAMPUS = 'Karunya Nagar Campus';
const EMPTY = {
  routeName: '',
  routeCode: '',
  startPoint: '',
  endPoint: CAMPUS,
  distanceKm: '',
  assignedBus: '',
  stops: [{ stopName: '', pickupTime: '', lat: '', lng: '' }],
};

const RoutesTab = () => {
  const list = useCrudList(routeApi);
  const form = useForm(EMPTY);
  const { values, errors, setValues, setErrors, handleChange } = form;
  const [buses, setBuses] = useState([]);

  // Bus dropdown options
  useEffect(() => {
    busApi.list().then(setBuses).catch(() => setBuses([]));
  }, []);

  const openForm = (route) => {
    form.reset(
      route
        ? {
            ...EMPTY,
            ...route,
            distanceKm: String(route.distanceKm),
            assignedBus: route.assignedBus?._id || '',
            stops: route.stops.map(({ stopName, pickupTime, lat, lng }) => ({
              stopName,
              pickupTime,
              lat: lat ?? '',
              lng: lng ?? '',
            })),
          }
        : EMPTY
    );
    list.setEditing(route || {});
  };

  // ----- Stop list editing -----
  const updateStop = (i, field, value) => {
    setValues((v) => ({ ...v, stops: v.stops.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)) }));
    setErrors((e) => ({ ...e, [`stops[${i}].${field}`]: undefined, stops: undefined }));
  };
  const addStop = () => setValues((v) => ({ ...v, stops: [...v.stops, { stopName: '', pickupTime: '', lat: '', lng: '' }] }));
  const removeStop = (i) => setValues((v) => ({ ...v, stops: v.stops.filter((_, idx) => idx !== i) }));
  const moveStop = (i, dir) =>
    setValues((v) => {
      const stops = [...v.stops];
      [stops[i], stops[i + dir]] = [stops[i + dir], stops[i]];
      return { ...v, stops };
    });

  // Order is simply the position in the list
  const toPayload = (v) => ({
    ...v,
    distanceKm: Number(v.distanceKm),
    assignedBus: v.assignedBus || null,
    stops: v.stops.map((s, i) => ({
      stopName: s.stopName,
      pickupTime: s.pickupTime,
      order: i + 1,
      // coordinates are optional; send them only when both are filled in
      ...(String(s.lat).trim() !== '' && String(s.lng).trim() !== '' ? { lat: Number(s.lat), lng: Number(s.lng) } : {}),
    })),
  });

  return (
    <>
      <TableToolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search route name, code or start point"
        addLabel="Add route"
        onAdd={() => openForm(null)}
      />

      <div className="card">
        {list.loading ? (
          <Loader />
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-signpost-split" title="No routes found" message="Try a different search or add a new route." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Route</th>
                  <th>From → To</th>
                  <th>Stops</th>
                  <th>Distance</th>
                  <th>Bus</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((r) => (
                  <tr key={r._id}>
                    <td><span className="badge bg-ku">{r.routeCode}</span></td>
                    <td>
                      <Link to={`/routes/${r._id}`} className="fw-semibold text-decoration-none">{r.routeName}</Link>
                    </td>
                    <td className="small">{r.startPoint} → {r.endPoint}</td>
                    <td>
                      {r.stops.length}
                      <span className="text-muted small ms-1">(first {to12h(r.stops[0]?.pickupTime)})</span>
                    </td>
                    <td>{r.distanceKm} km</td>
                    <td>{r.assignedBus?.busNumber || <span className="text-muted small">Not assigned</span>}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openForm(r)} title="Edit">
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => list.setDeleting(r)} title="Delete">
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
        title={list.editing?._id ? `Edit route ${list.editing.routeCode}` : 'Add route'}
        onClose={() => list.setEditing(null)}
        form={form}
        validate={validateRoute}
        toPayload={toPayload}
        onSave={list.save}
        size="modal-lg"
      >
        <div className="row">
          <div className="col-sm-8">
            <TextField label="Route name" name="routeName" value={values.routeName} onChange={handleChange} error={errors.routeName} placeholder="Gandhipuram - Karunya" required />
          </div>
          <div className="col-sm-4">
            <TextField label="Route code" name="routeCode" value={values.routeCode} onChange={handleChange} error={errors.routeCode} placeholder="R08" required />
          </div>
          <div className="col-sm-6">
            <TextField label="Start point" name="startPoint" value={values.startPoint} onChange={handleChange} error={errors.startPoint} required />
          </div>
          <div className="col-sm-6">
            <TextField label="End point" name="endPoint" value={values.endPoint} onChange={handleChange} error={errors.endPoint} hint="Campus is the common endpoint" />
          </div>
          <div className="col-sm-6">
            <TextField label="Distance (km)" name="distanceKm" type="number" step="0.1" min="0.1" value={values.distanceKm} onChange={handleChange} error={errors.distanceKm} required />
          </div>
          <div className="col-sm-6">
            <SelectField
              label="Assigned bus"
              name="assignedBus"
              value={values.assignedBus}
              onChange={handleChange}
              error={errors.assignedBus}
              placeholder="- None -"
              options={buses.map((b) => ({ value: b._id, label: `${b.busNumber} · ${b.driverName}${b.status !== 'Active' ? ` (${b.status})` : ''}` }))}
            />
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-2 mb-2">
          <label className="form-label mb-0">Stops (in order) <span className="text-danger">*</span></label>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addStop}>
            <i className="bi bi-plus-lg me-1" />Add stop
          </button>
        </div>
        {errors.stops && <div className="text-danger small mb-2">{errors.stops}</div>}

        {values.stops.map((s, i) => (
          <div className="mb-3" key={i}>
          <div className="row g-2 align-items-start mb-1">
            <div className="col-auto pt-2 small text-muted" style={{ width: 28 }}>{i + 1}.</div>
            <div className="col">
              <input
                className={`form-control form-control-sm ${errors[`stops[${i}].stopName`] ? 'is-invalid' : ''}`}
                placeholder="Stop name"
                value={s.stopName}
                onChange={(e) => updateStop(i, 'stopName', e.target.value)}
              />
              <div className="invalid-feedback">{errors[`stops[${i}].stopName`]}</div>
            </div>
            <div className="col-4 col-sm-3">
              <input
                type="time"
                className={`form-control form-control-sm ${errors[`stops[${i}].pickupTime`] ? 'is-invalid' : ''}`}
                value={s.pickupTime}
                onChange={(e) => updateStop(i, 'pickupTime', e.target.value)}
                aria-label="Pickup time"
              />
              <div className="invalid-feedback">{errors[`stops[${i}].pickupTime`]}</div>
            </div>
            <div className="col-auto btn-group btn-group-sm">
              <button type="button" className="btn btn-outline-secondary" disabled={i === 0} onClick={() => moveStop(i, -1)} title="Move up">
                <i className="bi bi-arrow-up" />
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={i === values.stops.length - 1} onClick={() => moveStop(i, 1)} title="Move down">
                <i className="bi bi-arrow-down" />
              </button>
              <button type="button" className="btn btn-outline-danger" disabled={values.stops.length === 1} onClick={() => removeStop(i)} title="Remove">
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>
          {/* Optional map position of this stop (right-click a place in Google Maps to copy its lat, lng) */}
          <div className="row g-2" style={{ paddingLeft: 28 }}>
            <div className="col-6">
              <input
                type="number"
                step="any"
                className={`form-control form-control-sm ${errors[`stops[${i}].lat`] ? 'is-invalid' : ''}`}
                placeholder="Latitude (optional)"
                value={s.lat}
                onChange={(e) => updateStop(i, 'lat', e.target.value)}
                aria-label="Latitude"
              />
              <div className="invalid-feedback">{errors[`stops[${i}].lat`]}</div>
            </div>
            <div className="col-6">
              <input
                type="number"
                step="any"
                className={`form-control form-control-sm ${errors[`stops[${i}].lng`] ? 'is-invalid' : ''}`}
                placeholder="Longitude (optional)"
                value={s.lng}
                onChange={(e) => updateStop(i, 'lng', e.target.value)}
                aria-label="Longitude"
              />
              <div className="invalid-feedback">{errors[`stops[${i}].lng`]}</div>
            </div>
          </div>
          </div>
        ))}
      </FormModal>

      <ConfirmModal
        show={!!list.deleting}
        message={<>Delete route <strong>{list.deleting?.routeCode} - {list.deleting?.routeName}</strong>? All schedules on this route will also be deleted.</>}
        busy={list.busy}
        onConfirm={list.confirmDelete}
        onClose={() => list.setDeleting(null)}
      />
    </>
  );
};

export default RoutesTab;
