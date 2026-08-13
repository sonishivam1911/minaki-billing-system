/**
 * AuthContext — Supabase GoTrue session + billing /auth/me permissions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { apiRequest } from '../services/apiClient';
import { AUTH_USERINFO_TIMEOUT_MS } from './authConstants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserInfo = async (accessToken) => {
    try {
      const userData = await apiRequest('GET', '/auth/me', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeoutMs: AUTH_USERINFO_TIMEOUT_MS,
      });

      setUserInfo(userData);
      setPermissions(userData.permissions || []);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      setUserInfo(null);
      setPermissions([]);
      setError(err.message);
      if (err.status === 401) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      }
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const errorMessage =
          signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : signInError.message || 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        const errorMessage = 'Login succeeded but no session was returned';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setSession(data.session);
      setUser(data.user);
      const loadedUserInfo = await fetchUserInfo(accessToken);
      if (!loadedUserInfo) {
        return {
          success: false,
          error:
            'Signed in, but the billing API could not load your account. Try again in a moment.',
        };
      }

      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
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

  const getIdToken = async (forceRefresh = false) => {
    if (forceRefresh) {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw refreshError;
      }
      if (data.session?.access_token) {
        setSession(data.session);
        setUser(data.session.user);
        return data.session.access_token;
      }
    }
    if (session?.access_token) {
      return session.access_token;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      throw new Error('User not authenticated');
    }
    return data.session.access_token;
  };

  const hasPermission = (moduleKey, action = 'read') => {
    if (!permissions || permissions.length === 0) return false;

    const modulePermission = permissions.find((p) => p.module_key === moduleKey);
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

  const hasRole = (role) => {
    if (!userInfo?.role) return false;
    return userInfo.role.toLowerCase() === role.toLowerCase();
  };

  const isAdmin = () => hasRole('admin');

  const isManager = () => hasRole('manager') || isAdmin();

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession) => {
      if (!mounted) return;
      try {
        if (nextSession?.access_token) {
          setSession(nextSession);
          setUser(nextSession.user ?? null);
          await fetchUserInfo(nextSession.access_token);
        } else {
          setSession(null);
          setUser(null);
          setUserInfo(null);
          setPermissions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
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
    isAuthenticated: !!user && !!userInfo && !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
