"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
export type User = {
  _id: string;
  name: string;
  email: string;
  role: "business" | "admin";
  mode: "provider" | "seeker";
  city: string;
  category: string;
  phone: string;
  address?: string;
  gstin?: string;
  documentId?: string;
  verification: string;
  verificationNote?: string;
  favorites: string[];
};
type Auth = {
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  login: (data: Record<string, string>) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  logout: () => Promise<void>;
  setDashboardRole: (mode: "provider" | "seeker") => Promise<void>;
  dashboardRole: "provider" | "seeker";
  updateUser: (data: Record<string, unknown>) => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = async () => {
    try {
      setUser(await api<User>("/auth/me"));
      setError("");
    } catch (e) {
      setUser(null);
      setError(
        (e as { status?: number }).status === 401 ? "" : (e as Error).message,
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    const expired = () => {
      setUser(null);
      setError("");
      setLoading(false);
    };
    window.addEventListener("utlio:session-expired", expired);
    api<User>("/auth/me")
      .then((u) => {
        if (active) {
          setUser(u);
          setError("");
        }
      })
      .catch((e) => {
        if (active && e.status !== 401) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener("utlio:session-expired", expired);
    };
  }, []);
  const login = async (data: Record<string, string>) => {
    const u = await api<User>("/auth/login", { method: "POST", body: data });
    setUser(u);
    setError("");
    setLoading(false);
    return u;
  };
  const register = async (data: Record<string, string>) => {
    const u = await api<User>("/auth/register", { method: "POST", body: data });
    setUser(u);
    setError("");
    setLoading(false);
    return u;
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    setError("");
  };
  const updateUser = async (data: Record<string, unknown>) =>
    setUser(await api<User>("/profile", { method: "PATCH", body: data }));
  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        refresh,
        login,
        register,
        logout,
        updateUser,
        dashboardRole: user?.mode || "seeker",
        setDashboardRole: (mode) => updateUser({ mode }),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider required");
  return context;
}
