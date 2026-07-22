'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50">
      <nav
        className={`rounded-full border transition-all duration-300 font-sans ${
          isScrolled
            ? 'bg-navy-card/85 border-navy-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md px-6 py-1.5'
            : 'bg-navy-card/65 border-navy-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md px-8 py-2.5'
        }`}
      >
        <div className="w-full">
          <div className="flex h-12 justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="font-extrabold text-lg text-white font-playfair tracking-wide hover:text-rust hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(217,93,57,0.5)] transition-all duration-300 inline-block cursor-pointer"
              >
                GatherFlow
              </Link>
              
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex ml-8 space-x-2">
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive('/') 
                      ? 'bg-rust text-white shadow-sm shadow-rust/10' 
                      : 'text-navy-muted hover:text-white hover:bg-navy-bg/40'
                  }`}
                >
                  All Events
                </Link>
                {user && (
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive('/dashboard') 
                          ? 'bg-rust text-white shadow-sm shadow-rust/10' 
                          : 'text-navy-muted hover:text-white hover:bg-navy-bg/40'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/events/create"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive('/events/create') 
                          ? 'bg-rust text-white shadow-sm shadow-rust/10' 
                          : 'text-navy-muted hover:text-white hover:bg-navy-bg/40'
                      }`}
                    >
                      Create Event
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Auth Links */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-navy-muted">
                    Signed in as <strong className="text-white font-semibold">{user.name}</strong>
                  </span>
                  <button
                    onClick={logout}
                    className="rounded-full border border-navy-border bg-navy-bg/60 px-3.5 py-1.5 text-[10px] font-bold text-navy-muted shadow-sm hover:text-white hover:bg-rust hover:border-rust cursor-pointer transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-navy-muted hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-rust px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rust-hover transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center rounded-full p-2 text-navy-muted hover:bg-navy-bg hover:text-white focus:outline-none"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-2 rounded-2xl border border-navy-border/60 bg-navy-card/95 backdrop-blur-md px-3 pt-2 pb-4 space-y-1 shadow-xl">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
              isActive('/') ? 'bg-rust text-white' : 'text-navy-muted hover:bg-navy-bg/50 hover:text-white'
            }`}
          >
            All Events
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                  isActive('/dashboard') ? 'bg-rust text-white' : 'text-navy-muted hover:bg-navy-bg/50 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/events/create"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                  isActive('/events/create') ? 'bg-rust text-white' : 'text-navy-muted hover:bg-navy-bg/50 hover:text-white'
                }`}
              >
                Create Event
              </Link>
            </>
          )}

          <div className="border-t border-navy-border/40 pt-4 mt-2">
            {user ? (
              <div className="px-3 space-y-2">
                <p className="text-xs text-navy-muted">
                  Signed in as <strong className="text-white font-semibold">{user.name}</strong>
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-center rounded-xl border border-navy-border bg-navy-bg px-4 py-2 text-xs font-bold text-navy-text hover:bg-rust hover:border-rust cursor-pointer transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-3 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 text-xs font-semibold text-navy-muted hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center rounded-xl bg-rust py-2 text-xs font-bold text-white hover:bg-rust-hover"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
