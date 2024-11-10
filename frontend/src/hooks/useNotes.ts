import { useCallback, useEffect, useState } from 'react';
import { useApi } from '@/utils/api';

export const useNotes = () => {
  const { api } = useApi();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api('/notes/');
      setNotes(response.data);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, fetchNotes };
};
