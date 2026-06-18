import axios, { AxiosInstance } from 'axios';
import { getStoredToken, handleUnauthorizedSession } from '@/helpers/authSession';

const attachInterceptors = (instance: AxiosInstance, isMultipart = false) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getStoredToken();
      config.headers = config.headers || {};

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }

      config.headers.Accept = 'application/json';

      if (isMultipart) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        handleUnauthorizedSession();
      }

      return Promise.reject(error);
    }
  );
};

const createAxiosInstance = (): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
  });

  attachInterceptors(axiosInstance);

  return axiosInstance;
};

const updateAxiosInstance = (): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
  });

  attachInterceptors(axiosInstance, true);

  return axiosInstance;
};

export const axiosInstance = createAxiosInstance();
export const axiosInstanceUpdate = updateAxiosInstance();
