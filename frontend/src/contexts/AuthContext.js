import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/login", {
        email,
        password
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("token", response.data.token);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: "Błąd logowania" };
    } finally {
      setLoading(false);
    }
  };

  const value = { user, login, loading };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
