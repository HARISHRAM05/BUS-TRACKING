// Admin: inbox of problems reported by riders. Set a status and write a reply the rider can read.
import { useState } from 'react';
import { issueApi } from '../../../services/api';
import useCrudList from './useCrudList';
import useForm from '../../../utils/useForm';
import { validateIssueUpdate } from '../../../utils/validation';
import { ISSUE_CATEGORIES, ISSUE_STATUSES, ISSUE_STATUS_BADGE, formatDateTime } from '../../../utils/format';
import FormModal from './FormModal';
import ConfirmModal from '../../../components/ConfirmModal';
import Loader from '../../../components/Loader';
import EmptyState from '../../../components/EmptyState';
import { SelectField, TextAreaField } from '../../../components/FormField';

const ReportsTab = () => {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const params = {};
  if (status) params.status = status;
  if (category) params.category = category;

  const list = useCrudList(issueApi, params);
  const form = useForm({ status: 'Open', adminNote: '' });
  const { values, errors, handleChange } = form;
  const open = list.editing?._id ? list.editing : null;

  const openReview = (issue) => {
    form.reset({ status: issue.status, adminNote: issue.adminNote || '' });
    list.setEditing(issue);
  };

  return (
    <>
      <div className="d-flex flex-column flex-md-row gap-2 mb-3">
        <select className="form-select" style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ISSUE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 220 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {ISSUE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        {list.loading ? (
          <Loader />
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-flag" title="No reports" message="Problems reported by riders will show up here." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Rider</th>
                  <th>Problem</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((i) => (
                  <tr key={i._id}>
                    <td className="small text-nowrap">{formatDateTime(i.createdAt)}</td>
                    <td className="small">
                      <div className="fw-semibold">{i.user?.name || 'Deleted user'}</div>
                      <div className="text-muted">{i.user?.userType}{i.user?.registerNo ? ` · ${i.user.registerNo}` : ''}</div>
                    </td>
                    <td style={{ minWidth: 240 }}>
                      <span className="fw-semibold">{i.category}</span>
                      {i.route && <span className="badge bg-ku ms-2">{i.route.routeCode}</span>}
                      <div className="small text-muted">{i.message}</div>
                    </td>
                    <td><span className={`badge ${ISSUE_STATUS_BADGE[i.status]}`}>{i.status}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openReview(i)}>
                        <i className="bi bi-reply me-1" />Reply
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => list.setDeleting(i)} title="Delete">
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
        show={!!open}
        title="Review report"
        onClose={() => list.setEditing(null)}
        form={form}
        validate={validateIssueUpdate}
        onSave={list.save}
      >
        {open && (
          <div className="bg-ku-light rounded p-3 mb-3 small">
            <div><strong>{open.category}</strong>{open.route ? ` · ${open.route.routeCode} ${open.route.routeName}` : ''}</div>
            <div className="text-muted mb-2">
              {open.user?.name} ({open.user?.email}) · {formatDateTime(open.createdAt)}
            </div>
            <div>{open.message}</div>
          </div>
        )}
        <SelectField label="Status" name="status" value={values.status} onChange={handleChange} error={errors.status} options={ISSUE_STATUSES} required />
        <TextAreaField
          label="Reply to the rider (optional)"
          name="adminNote"
          rows={3}
          maxLength={300}
          value={values.adminNote}
          onChange={handleChange}
          error={errors.adminNote}
          hint="The rider sees this on their Report page."
        />
      </FormModal>

      <ConfirmModal
        show={!!list.deleting}
        title="Delete report"
        message={<>Delete this <strong>{list.deleting?.category}</strong> report from {list.deleting?.user?.name || 'a rider'}? This cannot be undone.</>}
        busy={list.busy}
        onConfirm={list.confirmDelete}
        onClose={() => list.setDeleting(null)}
      />
    </>
  );
};

export default ReportsTab;
