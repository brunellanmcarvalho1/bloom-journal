import { createContext, startTransition, useEffect, useState } from "react";

import { api } from "../lib/api.js";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(localStorage.getItem("diary_token")),
  );

  useEffect(() => {
    const token = localStorage.getItem("diary_token");

    if (!token) {
      return;
    }

    api
      .get("/api/auth/me")
      .then((response) => {
        startTransition(() => {
          setUser(response.data.user);
        });
      })
      .catch(() => {
        localStorage.removeItem("diary_token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function login(values) {
    const response = await api.post("/api/auth/login", values);
    localStorage.setItem("diary_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(values) {
    const response = await api.post("/api/auth/register", values);
    localStorage.setItem("diary_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    localStorage.removeItem("diary_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
