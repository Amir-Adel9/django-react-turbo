import type { User } from '@/shared/api/api.types';
import { createSlice } from "@reduxjs/toolkit";

const USER_STORAGE_KEY = "auth_user";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user == null) localStorage.removeItem(USER_STORAGE_KEY);
  else localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getStoredUser() as User | null,
    loading: false,
  },
  reducers: {
    setUser: (state, action: { payload: User | null }) => {
      state.user = action.payload;
      setStoredUser(action.payload);
    },
    setLoading: (state, action: { payload: boolean }) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, setLoading } = authSlice.actions;
