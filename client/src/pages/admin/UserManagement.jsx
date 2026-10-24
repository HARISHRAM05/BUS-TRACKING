// Admin: view, add, update and remove users
import { useState } from 'react';
import { userApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useCrudList from './operations/useCrudList';
import useForm from '../../utils/useForm';
import { validateUser } from '../../utils/validation';
import TableToolbar from './operations/TableToolbar';
import FormModal from './operations/FormModal';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import PasswordChecklist from '../../components/PasswordChecklist';
import { TextField, SelectField, PasswordField } from '../../components/FormField';

const EMPTY = { name: '', email: '', password: '', role: 'User', userType: 'Student', registerNo: '', status: 'active' };

const UserManagement = () => {
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const params = {};
  if (role) params.role = role;
  if (status) params.status = status;

  const list = useCrudList(userApi, params);
  const form = useForm(EMPTY);
  const { values, errors, handleChange } = form;
  const isEdit = !!list.editing?._id;
  const editingSelf = isEdit && list.editing._id === me._id;

  const openForm = (u) => {
    form.reset(u ? { ...EMPTY, ...u, userType: u.userType || 'Student', password: '' } : EMPTY);
    list.setEditing(u || {});
  };

  // Strip fields that don't apply; empty password on edit = keep current password
  const toPayload = (v) => {
    const p = { name: v.name, email: v.email, role: v.role, status: v.status };
    if (v.role === 'User') {
      p.userType = v.userType;
      p.registerNo = v.registerNo;
    }
    if (v.password) p.password = v.password;
    return p;
  };

  return (
    <div className="container py-4">
      <h1 className="h3 fw-bold text-ku mb-1">User Management</h1>
      <p className="text-muted">Students, staff and Transport Office admins registered on the portal.</p>

      <TableToolbar
        search={list.search}
        onSearch={list.setSearch}
        placeholder="Search name, email or register no"
        addLabel="Add user"
        onAdd={() => openForm(null)}
      >
        <select className="form-select" style={{ maxWidth: 150 }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option>Admin</option>
          <option>User</option>
        </select>
        <select className="form-select" style={{ maxWidth: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </TableToolbar>

      <div className="card">
        {list.loading ? (
          <Loader />
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-people" title="No users found" message="Try a different search or filter." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Reg No / Staff ID</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((u) => {
                  const self = u._id === me._id;
                  return (
                    <tr key={u._id}>
                      <td className="fw-semibold">
                        {u.name} {self && <span className="badge text-bg-light border ms-1">You</span>}
                      </td>
                      <td className="small">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'Admin' ? 'bg-ku' : 'text-bg-light border'}`}>{u.role}</span>
                      </td>
                      <td>{u.userType || '-'}</td>
                      <td className="small">{u.registerNo || '-'}</td>
                      <td>
                        <span className={`badge ${u.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>{u.status}</span>
                      </td>
                      <td className="small text-nowrap">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="text-end text-nowrap">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openForm(u)} title="Edit">
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => list.setDeleting(u)}
                          disabled={self}
                          title={self ? 'You cannot delete yourself' : 'Delete'}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        show={!!list.editing}
        title={isEdit ? `Edit ${list.editing.name}` : 'Add user'}
        onClose={() => list.setEditing(null)}
        form={form}
        validate={(v) => validateUser(v, isEdit)}
        toPayload={toPayload}
        onSave={list.save}
      >
        <TextField label="Full name" name="name" value={values.name} onChange={handleChange} error={errors.name} required />
        <TextField label="Email" name="email" type="email" value={values.email} onChange={handleChange} error={errors.email} required />
        <div className="row">
          <div className="col-6">
            <SelectField
              label="Role"
              name="role"
              value={values.role}
              onChange={handleChange}
              error={errors.role}
              options={['User', 'Admin']}
              disabled={editingSelf}
              required
            />
          </div>
          <div className="col-6">
            <SelectField
              label="Status"
              name="status"
              value={values.status}
              onChange={handleChange}
              error={errors.status}
              options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              disabled={editingSelf}
              required
            />
          </div>
        </div>
        {editingSelf && <p className="small text-muted mt-n2">You can't change your own role or status.</p>}
        {values.role === 'User' && (
          <div className="row">
            <div className="col-6">
              <SelectField label="Type" name="userType" value={values.userType} onChange={handleChange} error={errors.userType} options={['Student', 'Staff']} required />
            </div>
            <div className="col-6">
              <TextField label="Reg No / Staff ID" name="registerNo" value={values.registerNo} onChange={handleChange} error={errors.registerNo} />
            </div>
          </div>
        )}
        <PasswordField
          label={isEdit ? 'New password (leave blank to keep current)' : 'Password'}
          name="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
          required={!isEdit}
        />
        <PasswordChecklist password={values.password} />
      </FormModal>

      <ConfirmModal
        show={!!list.deleting}
        message={<>Remove <strong>{list.deleting?.name}</strong> ({list.deleting?.email}) from the portal? This cannot be undone.</>}
        confirmText="Remove"
        busy={list.busy}
        onConfirm={list.confirmDelete}
        onClose={() => list.setDeleting(null)}
      />
    </div>
  );
};

export default UserManagement;
