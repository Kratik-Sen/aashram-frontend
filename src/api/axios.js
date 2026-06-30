import axios from "axios";
import { getApiBaseUrl } from "./baseUrl";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000
});

const defaultAdapter = axios.getAdapter(axios.defaults.adapter);
const CACHE_PREFIX = "aashram_api_cache:";
const CACHE_TTL = 1000 * 60 * 60 * 24;
const MAX_CACHE_ENTRIES = 80;

const readCurrentUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("aashram_user") || "{}")._id || "guest";
  } catch (error) {
    return "guest";
  }
};

const stableParams = (params = {}) => JSON.stringify(
  Object.keys(params || {})
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== "") acc[key] = params[key];
      return acc;
    }, {})
);

const getCacheKey = (config) => `${CACHE_PREFIX}${readCurrentUserId()}:${config.baseURL || ""}:${config.url || ""}:${stableParams(config.params)}`;

const getAreasForUrl = (url = "") => {
  const areaMap = [
    ["/dashboard", ["dashboard", "items", "stock", "purchases", "issues", "donations", "requests", "suppliers", "departments"]],
    ["/users", ["users"]],
    ["/items", ["items", "stock"]],
    ["/purchases", ["purchases", "dashboard", "reports"]],
    ["/issues", ["issues", "stock", "dashboard", "reports"]],
    ["/donations", ["donations", "stock", "dashboard", "reports"]],
    ["/requests", ["requests", "stock", "dashboard"]],
    ["/suppliers", ["suppliers", "dashboard"]],
    ["/departments", ["departments", "dashboard"]],
    ["/reports", ["reports"]]
  ];

  return areaMap.find(([path]) => url.includes(path))?.[1] || [];
};

const shouldCache = (config) => {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";

  return method === "get" &&
    !url.includes("/auth/") &&
    !url.includes("/notifications/");
};

const readCache = (key) => {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || "null");
    if (!cached) return null;
    if (Date.now() - cached.updatedAt > CACHE_TTL) return null;
    return cached;
  } catch (error) {
    return null;
  }
};

const pruneCache = () => {
  const entries = Object.keys(localStorage)
    .filter((key) => key.startsWith(CACHE_PREFIX))
    .map((key) => {
      try {
        return { key, updatedAt: JSON.parse(localStorage.getItem(key) || "{}").updatedAt || 0 };
      } catch (error) {
        return { key, updatedAt: 0 };
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  entries.slice(MAX_CACHE_ENTRIES).forEach(({ key }) => localStorage.removeItem(key));
};

const writeCache = (key, response, notify = false) => {
  try {
    const previous = localStorage.getItem(key);
    const next = {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.config.url,
      areas: getAreasForUrl(response.config.url),
      updatedAt: Date.now()
    };
    const serialized = JSON.stringify(next);
    localStorage.setItem(key, serialized);
    pruneCache();

    if (notify && previous && JSON.stringify(JSON.parse(previous).data) !== JSON.stringify(next.data)) {
      window.dispatchEvent(new CustomEvent("aashram:api-cache-updated", {
        detail: {
          id: `cache-${next.updatedAt}`,
          area: next.areas[0],
          areas: next.areas,
          action: "cache-updated",
          url: next.url
        }
      }));
    }
  } catch (error) {
    // Local storage can be full or disabled; the network response still works.
  }
};

const cachedResponse = (cached, config) => ({
  data: cached.data,
  status: cached.status || 200,
  statusText: cached.statusText || "OK",
  headers: cached.headers || {},
  config,
  request: {},
  fromCache: true
});

api.defaults.adapter = async (config) => {
  if (!shouldCache(config) || config.skipStaleCache) {
    const response = await defaultAdapter(config);
    if (shouldCache(config)) writeCache(getCacheKey(config), response);
    return response;
  }

  const cacheKey = getCacheKey(config);
  const cached = readCache(cacheKey);

  if (cached) {
    defaultAdapter({ ...config, skipStaleCache: true })
      .then((response) => writeCache(cacheKey, response, true))
      .catch(() => {});

    return cachedResponse(cached, config);
  }

  try {
    const response = await defaultAdapter(config);
    writeCache(cacheKey, response);
    return response;
  } catch (error) {
    const fallback = readCache(cacheKey);
    if (fallback) return cachedResponse(fallback, config);
    throw error;
  }
};

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
