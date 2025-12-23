/**
 * AuthContext
 * Manages authentication state and provides auth functions
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiRequest } from '../services/apiClient';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Provides authentication context to the entire app
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user info and permissions from backend
   */
  const fetchUserInfo = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      
      // Fetch user info from backend
      const userData = await apiRequest('GET', '/auth/me', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUserInfo(userData);
      setPermissions(userData.permissions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      setError(err.message);
      // Don't clear user on error - might be temporary network issue
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user info from backend
      await fetchUserInfo(firebaseUser);

      return { success: true, user: firebaseUser };
    } catch (err) {
      const errorMessage = err.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : err.code === 'auth/user-not-found'
        ? 'User not found'
        : err.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : err.message || 'Login failed';
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      setUserInfo(null);
      setPermissions([]);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current Firebase ID token
   */
  const getIdToken = async (forceRefresh = false) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken(forceRefresh);
  };

  /**
   * Check if user has permission for a module
   */
  const hasPermission = (moduleKey, action = 'read') => {
    if (!permissions || permissions.length === 0) return false;
    
    const modulePermission = permissions.find(p => p.module_key === moduleKey);
    if (!modulePermission) return false;

    switch (action) {
      case 'view':
        return modulePermission.can_view === true;
      case 'read':
        return modulePermission.can_read === true;
      case 'write':
        return modulePermission.can_write === true;
      default:
        return false;
    }
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role) => {
    return userInfo?.role === role;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => {
    return hasRole('admin');
  };

  /**
   * Check if user is manager
   */
  const isManager = () => {
    return hasRole('manager') || isAdmin();
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user info from backend
        await fetchUserInfo(firebaseUser);
      } else {
        setUser(null);
        setUserInfo(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userInfo,
    permissions,
    loading,
    error,
    login,
    logout,
    getIdToken,
    hasPermission,
    hasRole,
    isAdmin,
    isManager,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Access authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

