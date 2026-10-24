// Shared logic for every admin table: load list, search, add/edit modal, delete confirmation.
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import useDebounce from '../../../utils/useDebounce';

const useCrudList = (api, extraParams = {}) => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [editing, setEditing] = useState(null); // null = closed, {} = add, {...item} = edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const paramsKey = JSON.stringify(extraParams);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...JSON.parse(paramsKey) };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      setItems(await api.list(params));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [api, debouncedSearch, paramsKey, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Called by the form modal. Throws so the form can show inline errors.
  const save = async (values) => {
    const result = editing?._id ? await api.update(editing._id, values) : await api.create(values);
    toast.success(result.message);
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const { message } = await api.remove(deleting._id);
      toast.success(message);
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return { items, loading, search, setSearch, editing, setEditing, deleting, setDeleting, busy, save, confirmDelete, reload: load };
};

export default useCrudList;
