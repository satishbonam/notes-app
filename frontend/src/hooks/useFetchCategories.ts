import { useState, useCallback } from 'react';
import { useApi } from '@/utils/api';

export const useFetchCategories = () => {
  const { api } = useApi();
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api('/categories/');
      setCategories(
        response.data.map((category: { id: number; name: string }) => ({
          label: category.name,
          value: String(category.id),
        }))
      );
    } catch {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createCategory = useCallback(
    async (name: string) => {
      try {
        const response = await api('/categories/', {
          method: 'POST',
          data: { name },
        });
        const newCategory = {
          label: response.data.name,
          value: String(response.data.id),
        };
        setCategories((prev) => [...prev, newCategory]);
        return newCategory.value;
      } catch  {
        return null;
      }
    },
    [api]
  );

  return { categories, fetchCategories, createCategory, loading, error };
};