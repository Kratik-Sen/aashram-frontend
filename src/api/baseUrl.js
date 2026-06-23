const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

export const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");

  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

export const getSocketBaseUrl = () => getApiBaseUrl().replace(/\/api$/, "");
