import axios from "axios";
import { API_URL } from "../config/constants";
import useAuthStore from "../store/authStore";
import { showAuthErrorToast } from "../utils/toastMessages";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrfToken = useAuthStore.getState().csrfToken;
  const method = (config.method || "get").toLowerCase();
  if (csrfToken && method !== "get") {
    config.headers = config.headers || {};
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config || {};

    if (status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true;
      try {
        const res = await refreshClient.post("/api/auth/refresh", null, {
          skipAuthRefresh: true,
        });
        const csrfToken = res.data.csrfToken || res.data.csrf_token;
        useAuthStore.getState().setAuth(res.data.user, csrfToken);
        return api(originalRequest);
      } catch (refreshError) {
        // Only show "session expired" toast if the user was actually logged in.
        // This prevents a toast from firing for unauthenticated visitors on public pages.
        const wasLoggedIn = !!useAuthStore.getState().user;
        useAuthStore.getState().logout();
        if (wasLoggedIn) {
          showAuthErrorToast(refreshError, "Session expired. Please log in again.");
        }
        return Promise.reject(refreshError);
      }
    }

    if (status === 429) {
      showAuthErrorToast(error, "Too many attempts. Please try again later.");
    }

    return Promise.reject(error);
  },
);

//auth
export const loginUser = (data) => {
  return api.post("/api/auth/login", data);
};
export const registerUser = (data) => {
  return api.post("/api/auth/register", data);
};
export const getMe = () => {
  return api.get("/api/auth/me");
};
export const logoutUser = () => {
  return api.post("/api/auth/logout");
};
export const refreshSession = () => {
  return refreshClient.post("/api/auth/refresh", null, { skipAuthRefresh: true });
};
export const forgotPassword = (email) => {
  return api.post("/api/auth/forgot-password", { email }, { skipAuthRefresh: true });
};
export const resetPassword = (token, password) => {
  return api.post("/api/auth/reset-password", { token, password }, { skipAuthRefresh: true });
};


//code execution
export const executeCode = (data) => {
  return api.post("/api/run", data);
};
export const getHistory = () => {
  return api.get("/api/history");
};

export const getExecutionById = (id) => {
  return api.get(`/api/history/${id}`);
};

//room

export const createRoom = (data) => {
  return api.post("/api/rooms", data);
};
export const getRoomById = (roomId) => {
  return api.get(`/api/rooms/${roomId}`);
};
