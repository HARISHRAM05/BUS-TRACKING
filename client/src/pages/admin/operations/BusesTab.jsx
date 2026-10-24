import { useState } from 'react';
import { busApi } from '../../../services/api';
import useCrudList from './useCrudList';
import useForm from '../../../utils/useForm';
import { validateBus } from '../../../utils/validation';
import { BUS_STATUS_BADGE } from '../../../utils/format';
import TableToolbar from './TableToolbar';
import FormModal from './FormModal';
import ConfirmModal from '../../../components/ConfirmModal';
import Loader from '../../../components/Loader';
import EmptyState from '../../../components/EmptyState';
import { TextField, SelectField } from '../../../components/FormField';

const EMPTY = { busNumber: '', registrationNo: '', capacity: '', driverName: '', driverPhone: '', status: 'Active' };
const STATUSES = ['Active', 'Maintenance', 'Inactive'];

const BusesTab = () => {
  const [status, setStatus] = useState('');
  const list = useCrudList(busApi, status ? { status } : {});
  const form = useForm(EMPTY);
  const { values, errors, handleChange } = form;

  const openForm = (bus) => {
    form.reset(bus ? { ...EMPTY, ...bus, capacity: String(bus.capacity) } : EMPTY);
    list.setEditing(bus || {});
  };

  return (
    <>
      <TableToolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search bus number, registration or driver"
        addLabel="Add bus"
        onAdd={() => openForm(null)}
      >
        <select className="form-select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </TableToolbar>

      <div className="card">
        {list.loading ? (
          <Loader />
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-bus-front" title="No buses found" message="Try a different search or add a new bus." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Bus No</th>
                  <th>Registration</th>
                  <th>Capacity</th>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((b) => (
                  <tr key={b._id}>
                    <td className="fw-semibold">{b.busNumber}</td>
                    <td>{b.registrationNo}</td>
                    <td>{b.capacity}</td>
                    <td>{b.driverName}</td>
                    <td>{b.driverPhone}</td>
                    <td><span className={`badge ${BUS_STATUS_BADGE[b.status]}`}>{b.status}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openForm(b)} title="Edit">
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => list.setDeleting(b)} title="Delete">
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
        title={list.editing?._id ? `Edit bus ${list.editing.busNumber}` : 'Add bus'}
        onClose={() => list.setEditing(null)}
        form={form}
        validate={validateBus}
        toPayload={(v) => ({ ...v, capacity: Number(v.capacity) })}
        onSave={list.save}
      >
        <div className="row">
          <div className="col-sm-6">
            <TextField label="Bus number" name="busNumber" value={values.busNumber} onChange={handleChange} error={errors.busNumber} placeholder="KU-07" required />
          </div>
          <div className="col-sm-6">
            <TextField label="Registration no" name="registrationNo" value={values.registrationNo} onChange={handleChange} error={errors.registrationNo} placeholder="TN 37 AB 1234" required />
          </div>
          <div className="col-sm-6">
            <TextField label="Capacity" name="capacity" type="number" min="1" max="100" value={values.capacity} onChange={handleChange} error={errors.capacity} required />
          </div>
          <div className="col-sm-6">
            <SelectField label="Status" name="status" value={values.status} onChange={handleChange} error={errors.status} options={STATUSES} required />
          </div>
          <div className="col-sm-6">
            <TextField label="Driver name" name="driverName" value={values.driverName} onChange={handleChange} error={errors.driverName} required />
          </div>
          <div className="col-sm-6">
            <TextField label="Driver phone" name="driverPhone" type="tel" value={values.driverPhone} onChange={handleChange} error={errors.driverPhone} placeholder="10-digit mobile" maxLength={10} required />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        show={!!list.deleting}
        message={<>Delete bus <strong>{list.deleting?.busNumber}</strong>? It will be unassigned from its route.</>}
        busy={list.busy}
        onConfirm={list.confirmDelete}
        onClose={() => list.setDeleting(null)}
      />
    </>
  );
};

export default BusesTab;
