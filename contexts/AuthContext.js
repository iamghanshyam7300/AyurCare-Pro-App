// ====================================================
// AuthContext.js — FINAL STABLE VERSION
// ====================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, loadTokensToCache } from "../services/api"; // ✅ FIXED IMPORT



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
  // LOAD USER ON APP START
  // ----------------------------------------------------
  useEffect(() => {
    const init = async () => {
      console.log("🔑 Loading token cache...");
      await loadTokensToCache(); // ✅ FIXED: ensures axios gets token immediately

      const token = await AsyncStorage.getItem("accessToken");
      console.log("TOKEN FOUND:", token);

      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      try {
        dispatch({ type: "AUTH_START" });

        const res = await authAPI.getMe();
        dispatch({ type: "AUTH_SUCCESS", payload: res.data.data });

      } catch (err) {
        console.log("❌ /auth/me failed", err);
        await AsyncStorage.clear();
        dispatch({ type: "AUTH_FAILURE", payload: "Session expired" });
      }
    };

    init();
  }, []);



  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------
  const login = async (credentials) => {
    dispatch({ type: "AUTH_START" });

    try {
      const res = await authAPI.login(credentials);

      const { accessToken, refreshToken, ...user } = res.data.data;

      // Save tokens
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      await loadTokensToCache(); // ✅ FIX: no more undefined token

      // IMPORTANT: prevent unverified doctors from logging in
      if (user.role === "DOCTOR" && user.is_verified !== "VERIFIED") {
        dispatch({ type: "AUTH_FAILURE", payload: "Your account is pending approval" });
        return { blocked: true, user };
      }

      dispatch({ type: "AUTH_SUCCESS", payload: user });

      return user;

    } catch (err) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: err.response?.data?.message || "Login failed",
      });
      throw err;
    }
  };



  // ----------------------------------------------------
  // REGISTER
  // ----------------------------------------------------
  const register = async (data) => {
  dispatch({ type: "AUTH_START" });

  try {
    const res = await authAPI.register(data);

    // Backend should NOT return tokens for DOCTOR
    const user = res.data.data;

    // If doctor → DO NOT log in
    if (user.role === "DOCTOR") {
      dispatch({ type: "SET_LOADING", payload: false });
      return { waiting: true };
    }

    // If patient → normal auto-login
    const { accessToken, refreshToken, ...userData } = res.data.data;

    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);

    await loadTokensToCache();

    dispatch({ type: "AUTH_SUCCESS", payload: userData });

    return { waiting: false };

  } catch (err) {
    dispatch({ type: "AUTH_FAILURE", payload: err.response?.data?.message });
    throw err;
  }
};



  // ----------------------------------------------------
  // REFRESH USER
  // ----------------------------------------------------
  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      dispatch({ type: "AUTH_SUCCESS", payload: res.data.data });
    } catch (err) {
      console.log("refreshUser failed", err);
    }
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
    refreshUser,
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ========================
// CUSTOM HOOK
// ========================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
