import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useApi = () => {
  const { getAccessTokenSilently,isAuthenticated,isLoading } = useAuth0();
  const [authToken, setAuthToken] = useState<string | null>(null);

  const api = useCallback(
    async <T = any>(
      url: string,
      options: AxiosRequestConfig = {},
      isPublic?: boolean
    ): Promise<AxiosResponse<T>> => {
      try {
        if (isPublic) {
          return axios({
            url: `${API_BASE_URL}${url}`,
            ...options,
          });
        }
        const token = await getAccessTokenSilently();
        setAuthToken(token);
        const headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        return axios({
          url: `${API_BASE_URL}${url}`,
          headers,
          ...options,
        });
      } catch (error) {
        throw error;
      }
    },
    [getAccessTokenSilently]
  );

  return { api,authToken ,isAuthenticated,isLoading};
};
