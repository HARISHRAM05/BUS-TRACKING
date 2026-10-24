// Delays a fast-changing value (e.g. search box text) so we don't call the API on every keystroke
import { useEffect, useState } from 'react';

const useDebounce = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default useDebounce;
