// ====================================================
// AuthContext.js — FINAL FIXED VERSION
// ====================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

// ========================
// CONTEXT
// ========================
const AuthContext = createContext();

// ========================
// INITIAL STATE
// ========================
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// ========================
// REDUCER
// ========================
const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
};

// ========================
// PROVIDER
// ========================
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ----------------------------------------------------
  // ⭐ REFRESH USER — required for EditUserProfile updates
  // ----------------------------------------------------
  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      dispatch({ type: "AUTH_SUCCESS", payload: res.data.data });
    } catch (err) {
      console.log("❌ refreshUser failed", err);
    }
  };

  // ----------------------------------------------------
  // CHECK TOKEN ON APP START
  // ----------------------------------------------------
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (token) {
          dispatch({ type: "AUTH_START" });
          const res = await authAPI.getMe();
          dispatch({ type: "AUTH_SUCCESS", payload: res.data.data });
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (err) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
      }
    };

    checkAuth();
  }, []);

  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------
  const login = async (credentials) => {
    dispatch({ type: "AUTH_START" });

    const res = await authAPI.login(credentials);
    const { accessToken, refreshToken, ...userData } = res.data.data;

    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);

    dispatch({ type: "AUTH_SUCCESS", payload: userData });
  };

  // ----------------------------------------------------
  // REGISTER
  // ----------------------------------------------------
  const register = async (data) => {
    dispatch({ type: "AUTH_START" });

    const res = await authAPI.register(data);
    const { accessToken, refreshToken, ...user } = res.data.data;

    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);

    dispatch({ type: "AUTH_SUCCESS", payload: user });
  };

  // ----------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------
  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");

    dispatch({ type: "LOGOUT" });

    try {
      await authAPI.logout();
    } catch {}
  };

  // ----------------------------------------------------
  const value = {
    ...state,
    login,
    register,
    logout,
    refreshUser, // ⭐ IMPORTANT EXPORT
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// ========================
// CUSTOM HOOK
// ========================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
