import axios from "axios";
import { API_URL } from "../config/constants";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
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

//code execution
export const executeCode = (data) => {
  return api.post("/api/execute", data);
};
export const getHistory = () => {
  return api.get("/api/history");
};

export const getExecutionById = (id) => {
  return api.get(`/api/history/${id}`);
};

//room

export const createRoom = (data) => {
  return api.post("/api/room", data);
};
export const getRoomById = (roomId) => {
  return api.get(`/api/room/${roomId}`);
};
