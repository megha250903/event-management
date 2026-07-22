'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (name.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLocalLoading(true);
    try {
      await register({ name, email, password });
    } catch (err: any) {
      setError(err.message || 'Failed to register. Email may already be in use.');
    } finally {
      setLocalLoading(false);
    }
  };

  const isSubmitting = loading || localLoading;

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 bg-navy-bg text-white font-sans">
      <div className="w-full max-w-md rounded-lg border border-navy-border bg-navy-card p-8 shadow-sm">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white font-sora">Create Account</h2>
          <p className="mt-1 text-sm text-navy-muted">
            Sign up to manage and register for events.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
              placeholder="•••••••• (min 6 characters)"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-rust hover:bg-rust-hover py-2.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer font-sora"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-rust hover:text-rust-hover hover:underline font-sora">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
