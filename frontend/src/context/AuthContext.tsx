// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Define the shape of your User object based on your backend's response
// This should match what your /user/signin or /admin/signin etc. returns in the 'user' field
export interface User {
  id: string; // Or _id depending on your backend
  name: string;
  email: string;
  role: string; // 'user', 'admin', 'collectionAgent'
  points?: number; // Optional, for regular users
  referralCode?: string; // Optional
  // Add any other fields your user object might have
  phone?: string;
  address?: string;
}

// --- THIS IS THE KEY CHANGE ---
// Add 'export' keyword here so other files can import this type
export interface AuthContextProps {
  token: string | null;
  user: User | null; // Changed from userRole to user object
  isAuthenticated: boolean;
  isLoading: boolean; // Added for initial auth check
  login: (token: string, userData: User) => void;
  logout: () => void;
  // Optional: function to update user data if it changes post-login
  // updateUser: (updatedUserData: Partial<User>) => void;
}
// --- END KEY CHANGE ---

const AuthContext = createContext<AuthContextProps>({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true
  login: () => {},
  logout: () => {},
  // updateUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For checking local storage initially

  // Load auth state from localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false); // Finished loading initial auth state
  }, []);

  const login = useCallback((newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData)); // Store user object
    setToken(newToken);
    setUser(userData);
    console.log("[AuthContext] Logged in. Token:", newToken, "User:", userData); // Added log
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    console.log("[AuthContext] Logged out."); // Added log
  }, []);

  // Optional: Function to update user data in context and localStorage
  // const updateUser = useCallback((updatedUserData: Partial<User>) => {
  //     setUser(prevUser => {
  //         if (prevUser) {
  //             const newUser = { ...prevUser, ...updatedUserData };
  //             localStorage.setItem("user", JSON.stringify(newUser));
  //             return newUser;
  //         }
  //         return null;
  //     });
  // }, []);

  const isAuthenticated = !!token && !!user;

  // Log context value changes for debugging
  useEffect(() => {
    console.log("[AuthContext] Value updated:", { token, user, isAuthenticated, isLoading });
  }, [token, user, isAuthenticated, isLoading]);


  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    // updateUser,
  };

  return (
    <AuthContext.Provider value={value}> {children} </AuthContext.Provider>
  );
};

export default AuthContext;
