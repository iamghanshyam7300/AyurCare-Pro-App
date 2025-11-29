import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { server } from "../config/server";

const API_BASE_URL = `${server()}/api`;

/* ----------------------------------------------------
   TOKEN CACHE (Fixes React Native async timing issues)
------------------------------------------------------*/
export let accessTokenCache = null;
export let refreshTokenCache = null;

// Load tokens ONCE on app startup
export const loadTokensToCache = async () => {
  accessTokenCache = await AsyncStorage.getItem("accessToken");
  refreshTokenCache = await AsyncStorage.getItem("refreshToken");
};

/* ----------------------------------------------------
   AXIOS INSTANCE
------------------------------------------------------*/
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

/* ----------------------------------------------------
   REQUEST INTERCEPTOR (Fix for RN AsyncStorage)
------------------------------------------------------*/
api.interceptors.request.use(
  async (config) => {
    // Use cached token if available
    if (accessTokenCache) {
      config.headers.Authorization = `Bearer ${accessTokenCache}`;
      return config;
    }

    // Fallback: load from AsyncStorage once
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      accessTokenCache = token;
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------------------------------------------
   RESPONSE INTERCEPTOR (Auto Token Refresh)
------------------------------------------------------*/
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken =
          refreshTokenCache || (await AsyncStorage.getItem("refreshToken"));

        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccess = res.data.data.accessToken;

        // Save new token
        await AsyncStorage.setItem("accessToken", newAccess);
        accessTokenCache = newAccess;

        // Retry original request
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (err) {
        console.log("❌ TOKEN REFRESH FAILED — logging out");
        accessTokenCache = null;
        refreshTokenCache = null;
        await AsyncStorage.clear();
        throw err;
      }
    }

    return Promise.reject(error);
  }
);

/* ----------------------------------------------------
   AUTH API
------------------------------------------------------*/
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  changePassword: (data) => api.post("/auth/change-password", data),
};

/* ----------------------------------------------------
   USERS API
------------------------------------------------------*/
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

/* ----------------------------------------------------
   PATIENTS API
------------------------------------------------------*/
export const patientsAPI = {
  getAll: (params) => api.get("/patients", { params }),
  getMine: () => api.get('/patients/doctor/me'),

  create: (data) => api.post("/patients", data),
  getById: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getDietPlans: (id, params) =>
    api.get(`/patients/${id}/diet-plans`, { params }),
  getHealthRecords: (id, params) =>
    api.get(`/patients/${id}/health-records`, { params }),
};

/* ----------------------------------------------------
   APPOINTMENTS API
------------------------------------------------------*/
export const appointmentsAPI = {
  getAll: (params) => api.get("/appointments", { params }),
  create: (data) => api.post("/appointments", data),
  getById: (id) => api.get(`/appointments/${id}`),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

/* ----------------------------------------------------
   FOODS API
------------------------------------------------------*/
export const foodsAPI = {
  getAll: (params) => api.get("/foods", { params }),
  create: (data) => api.post("/foods", data),
  getById: (id) => api.get(`/foods/${id}`),
  update: (id, data) => api.put(`/foods/${id}`, data),
  delete: (id) => api.delete(`/foods/${id}`),
  getByCategory: (category, params) =>
    api.get(`/foods/category/${category}`, { params }),
};

/* ----------------------------------------------------
   RECIPES API
------------------------------------------------------*/
export const recipesAPI = {
  getAll: (params) => api.get("/recipes", { params }),
  create: (data) => api.post("/recipes", data),
  getById: (id) => api.get(`/recipes/${id}`),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  delete: (id) => api.delete(`/recipes/${id}`),
};

/* ----------------------------------------------------
   DIET PLANS API
------------------------------------------------------*/
export const dietPlansAPI = {
  getAll: (params) => api.get("/diet-plans", { params }),
  create: (data) => api.post("/diet-plans", data),
  getById: (id) => api.get(`/diet-plans/${id}`),
  update: (id, data) => api.put(`/diet-plans/${id}`, data),
  delete: (id) => api.delete(`/diet-plans/${id}`),
  getItems: (id) => api.get(`/diet-plans/${id}/items`),
};

/* ----------------------------------------------------
   CHAT API
------------------------------------------------------*/
export const chatAPI = {
  getAll: (params) => api.get("/chat", { params }),
  sendMessage: (data) => api.post("/chat", data),
  getById: (id) => api.get(`/chat/${id}`),
  markAsRead: (id) => api.put(`/chat/${id}/read`),
  getConversation: (userId, params) =>
    api.get(`/chat/conversation/${userId}`, { params }),
};

/* ----------------------------------------------------
   REMINDERS API
------------------------------------------------------*/
export const remindersAPI = {
  getAll: (params) => api.get("/reminders", { params }),
  create: (data) => api.post("/reminders", data),
  getById: (id) => api.get(`/reminders/${id}`),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
};

/* ----------------------------------------------------
   HEALTH RECORDS API
------------------------------------------------------*/
export const healthRecordsAPI = {
  getAll: (params) => api.get("/health-records", { params }),
  create: (data) => api.post("/health-records", data),
  getById: (id) => api.get(`/health-records/${id}`),
  update: (id, data) => api.put(`/health-records/${id}`, data),
  delete: (id) => api.delete(`/health-records/${id}`),
};

/* ----------------------------------------------------
   EXPORT DEFAULT AXIOS
------------------------------------------------------*/
export default api;
