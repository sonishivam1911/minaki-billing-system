/**
 * ResetPasswordPage
 * Handles Supabase recovery redirect (/reset-password) and sets a new password.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gem, Lock, Loader, Mail } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../config/supabase';
import './LoginPage.css';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState('loading'); // loading | request | set
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // The account whose password this page changes, fixed when the page opens: { email, token }. Sign-ins are shared by
  // every tab of this site, so another tab signed in as someone else can replace the stored session a few seconds
  // after the reset link signs in (2026-11-10: a reset for one account changed another account's password). The save
  // uses this token, not whatever the browser holds by then.
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const hash = window.location.hash || '';
      const query = new URLSearchParams(window.location.search);
      const linkError = query.get('error_description') || new URLSearchParams(hash.slice(1)).get('error_description');
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (linkError) {
        setError(`${linkError}. Ask for a new reset link.`);
        setMode('request');
        return;
      }
      if (data.session) {
        setTarget({ email: data.session.user?.email || '', token: data.session.access_token });
        setMode('set');
        return;
      }
      if (query.get('code') || hash.includes('type=recovery') || hash.includes('type=invite')) {
        // PKCE: the link only works in the browser that asked for it.
        setError('This reset link could not be used here. Open it in the same browser you asked for it from, or ask for a new one.');
      }
      setMode('request');
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRequestReset = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) {
        setError(resetError.message || 'Could not send reset email');
        return;
      }
      setMessage('If that account exists, a reset email is on the way.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${target?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      }).catch(() => null);
      if (!res || !res.ok) {
        const body = res ? await res.json().catch(() => ({})) : {};
        setError(body.msg || body.error_description || body.message || 'Could not update password. Ask for a new reset link.');
        return;
      }
      setMessage('Password updated. Redirecting to login…');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <Gem size={48} />
          </div>
          <h1>Minaki Billing System</h1>
          <p className="login-subtitle">
            {mode === 'set' ? <>Choose a new password for <strong>{target?.email}</strong></> : 'Reset your password'}
          </p>
        </div>

        {mode === 'loading' ? (
          <div className="login-error" style={{ background: 'transparent', border: 'none' }}>
            <Loader className="spinner" size={24} />
          </div>
        ) : null}

        {mode === 'request' ? (
          <form onSubmit={handleRequestReset} className="login-form">
            {error ? <div className="login-error">{error}</div> : null}
            {message ? <div className="login-error" style={{ background: '#c6f6d5', color: '#276749', borderColor: '#9ae6b4' }}>{message}</div> : null}
            <div className="form-group">
              <label htmlFor="reset-email">
                <Mail size={18} />
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                disabled={submitting}
                autoComplete="email"
                autoFocus
              />
            </div>
            <button type="submit" className="login-button" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader className="spinner" size={20} />
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        ) : null}

        {mode === 'set' ? (
          <form onSubmit={handleSetPassword} className="login-form">
            {error ? <div className="login-error">{error}</div> : null}
            {message ? <div className="login-error" style={{ background: '#c6f6d5', color: '#276749', borderColor: '#9ae6b4' }}>{message}</div> : null}
            <div className="form-group">
              <label htmlFor="new-password">
                <Lock size={18} />
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">
                <Lock size={18} />
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="login-button" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader className="spinner" size={20} />
                  Saving…
                </>
              ) : (
                'Save password'
              )}
            </button>
          </form>
        ) : null}

        <div className="login-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
