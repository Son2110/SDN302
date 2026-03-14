import { createContext, useState, useEffect, useContext } from "react";
import { loginUser as apiLogin, registerUser as apiRegister, getCurrentUser, saveToken, saveUser, getToken, removeToken, removeUser } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify token on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const response = await getCurrentUser(storedToken);
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            saveUser(response.data);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Auth verification failed", error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await apiLogin(credentials);
    if (response.success && response.token) {
      saveToken(response.token);
      setTokenState(response.token);
      
      saveUser(response.data);
      setUser(response.data);
      setIsAuthenticated(true);
      return response;
    }
    throw new Error("Invalid response format");
  };

  const register = async (userData) => {
    const response = await apiRegister(userData);
    if (response.success && response.token) {
      saveToken(response.token);
      setTokenState(response.token);
      
      // Fetch user profile to get complete data
      try {
        const userRes = await getCurrentUser(response.token);
        if (userRes.success && userRes.data) {
          saveUser(userRes.data);
          setUser(userRes.data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        throw new Error("Registration succeeded but profile fetch failed: " + err.message);
      }
      return response;
    }
    throw new Error("Invalid response format");
  };

  const handleLogout = () => {
    removeToken();
    removeUser();
    setTokenState(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
