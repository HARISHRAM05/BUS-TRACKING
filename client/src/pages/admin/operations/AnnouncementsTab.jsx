// Admin: post, edit and remove notices that riders see as banners
import { useEffect, useState } from 'react';
import { announcementApi, routeApi } from '../../../services/api';
import useCrudList from './useCrudList';
import useForm from '../../../utils/useForm';
import { validateAnnouncement } from '../../../utils/validation';
import { SEVERITY_STYLE, formatDateTime, istEndOfDay, toIstDateInput } from '../../../utils/format';
import TableToolbar from './TableToolbar';
import FormModal from './FormModal';
import ConfirmModal from '../../../components/ConfirmModal';
import Loader from '../../../components/Loader';
import EmptyState from '../../../components/EmptyState';
import { TextField, SelectField, TextAreaField } from '../../../components/FormField';

const EMPTY = { title: '', message: '', severity: 'Info', route: '', expiresOn: '' };

const AnnouncementsTab = () => {
  const list = useCrudList(announcementApi, { all: true }); // admins also see expired notices
  const form = useForm(EMPTY);
  const { values, errors, handleChange } = form;
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    routeApi.list().then(setRoutes).catch(() => setRoutes([]));
  }, []);

  const openForm = (a) => {
    form.reset(
      a
        ? { title: a.title, message: a.message, severity: a.severity, route: a.route?._id || '', expiresOn: toIstDateInput(a.expiresAt) }
        : EMPTY
    );
    list.setEditing(a || {});
  };

  const toPayload = (v) => ({
    title: v.title,
    message: v.message,
    severity: v.severity,
    route: v.route || null,
    expiresAt: istEndOfDay(v.expiresOn),
  });

  const isExpired = (a) => a.expiresAt && new Date(a.expiresAt) <= new Date();

  return (
    <>
      <TableToolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search notices"
        addLabel="Post notice"
        onAdd={() => openForm(null)}
      />

      <div className="card">
        {list.loading ? (
          <Loader />
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-megaphone" title="No notices" message="Post a notice to warn riders about delays or changes." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Notice</th>
                  <th>For</th>
                  <th>Expires</th>
                  <th>Posted</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((a) => (
                  <tr key={a._id} className={isExpired(a) ? 'text-muted' : ''}>
                    <td>
                      <span className={`badge ${SEVERITY_STYLE[a.severity].badge}`}>{a.severity}</span>
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <div className="fw-semibold">{a.title}</div>
                      <div className="small text-muted">{a.message}</div>
                    </td>
                    <td>{a.route ? <span className="badge bg-ku">{a.route.routeCode}</span> : <span className="small">Everyone</span>}</td>
                    <td className="small text-nowrap">
                      {a.expiresAt ? formatDateTime(a.expiresAt) : 'Never'}
                      {isExpired(a) && <span className="badge text-bg-secondary ms-1">Expired</span>}
                    </td>
                    <td className="small text-nowrap">{formatDateTime(a.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openForm(a)} title="Edit">
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => list.setDeleting(a)} title="Delete">
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
        title={list.editing?._id ? 'Edit notice' : 'Post a notice'}
        onClose={() => list.setEditing(null)}
        form={form}
        validate={validateAnnouncement}
        toPayload={toPayload}
        onSave={list.save}
      >
        <TextField label="Title" name="title" value={values.title} onChange={handleChange} error={errors.title} maxLength={100} placeholder="e.g. Heavy rain: buses may be late" required />
        <TextAreaField label="Message" name="message" rows={3} maxLength={500} value={values.message} onChange={handleChange} error={errors.message} required />
        <div className="row">
          <div className="col-sm-6">
            <SelectField label="Level" name="severity" value={values.severity} onChange={handleChange} error={errors.severity} options={['Info', 'Warning', 'Urgent']} required />
          </div>
          <div className="col-sm-6">
            <SelectField
              label="Shown to"
              name="route"
              value={values.route}
              onChange={handleChange}
              error={errors.route}
              placeholder="Everyone"
              options={routes.map((r) => ({ value: r._id, label: `Riders of ${r.routeCode} - ${r.routeName}` }))}
            />
          </div>
        </div>
        <TextField
          label="Hide after (optional)"
          name="expiresOn"
          type="date"
          value={values.expiresOn}
          onChange={handleChange}
          error={errors.expiresOn}
          hint="Leave empty to keep it until you remove it. It disappears at the end of this day."
        />
      </FormModal>

      <ConfirmModal
        show={!!list.deleting}
        message={<>Remove the notice <strong>{list.deleting?.title}</strong>? Riders will stop seeing it.</>}
        confirmText="Remove"
        busy={list.busy}
        onConfirm={list.confirmDelete}
        onClose={() => list.setDeleting(null)}
      />
    </>
  );
};

export default AnnouncementsTab;
