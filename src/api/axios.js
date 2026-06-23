import axios from "axios";
import { getApiBaseUrl } from "./baseUrl";

const api = axios.create({
  baseURL: getApiBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aashram_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("aashram_token");
      localStorage.removeItem("aashram_user");
    }
    return Promise.reject(error);
  }
);

export default api;
