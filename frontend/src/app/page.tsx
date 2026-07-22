'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, EventItem } from '@/lib/api';
import { 
  Search, MapPin, Calendar, Users, ArrowUpDown, 
  ArrowRight, Sparkles 
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('ASC');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvents({
        search: search.trim() || undefined,
        location: location.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      if (isMountedRef.current) {
        setEvents(res.events);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load events.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, location, startDate, endDate, sortBy, sortOrder]);

  const handleReset = () => {
    setSearch('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('ASC');
  };

  const handleScrollToEvents = () => {
    const element = document.getElementById('explore-events');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getEventImage = (event: EventItem) => {
    if (event.image_url) {
      return event.image_url;
    }
    const lowerName = event.name.toLowerCase();
    if (
      lowerName.includes('hackathon') ||
      lowerName.includes('code') ||
      lowerName.includes('dev') ||
      lowerName.includes('web') ||
      lowerName.includes('program')
    ) {
      return '/event_hackathon.png';
    }
    return '/event_meetup.png';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="flex-1 bg-navy-bg text-white">
      
      {/* 1. CLEAN HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-navy-border/40">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
        >
          <source src="/hero_background.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-grid-navy mask-radial-fade opacity-40 pointer-events-none" />
        
        {/* Ambient background glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rust/5 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rust/10 border border-rust/20 px-3.5 py-1 text-xs font-semibold text-rust font-sora mx-auto">
            <Sparkles className="h-3.5 w-3.5 text-rust animate-pulse" />
            <span>DISCOVER GATHERINGS NEAR YOU</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-playfair transition-all duration-500 hover:scale-[1.015] hover:drop-shadow-[0_0_25px_rgba(217,93,57,0.25)] cursor-default select-none origin-center">
            Explore and host <span className="inline-block text-rust hover:text-orange-400 hover:scale-105 transition-all duration-300 origin-center">amazing events</span>
          </h1>
          
          <p className="text-sm sm:text-base text-navy-muted font-sans max-w-xl mx-auto leading-relaxed">
            Find local meetups, developer conferences, and tech hackathons in your area, or create an account to start hosting and managing your own registrations.
          </p>

          {/* Clean, Integrated Search Bar inside Hero */}
          <div className="bg-navy-card/85 border border-navy-border/80 p-2 rounded-xl max-w-2xl mx-auto shadow-lg backdrop-blur-md flex flex-col sm:flex-row gap-2 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-navy-muted" />
              <input
                type="text"
                placeholder="Search events by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-transparent py-2.5 pl-9 pr-4 text-xs text-white placeholder-navy-muted focus:outline-none font-sans"
              />
            </div>
            <div className="hidden sm:block w-[1px] bg-navy-border/40 my-2" />
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-navy-muted" />
              <input
                type="text"
                placeholder="Filter by location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg bg-transparent py-2.5 pl-9 pr-4 text-xs text-white placeholder-navy-muted focus:outline-none font-sans"
              />
            </div>
            <button
              onClick={handleScrollToEvents}
              className="rounded-lg bg-rust hover:bg-rust-hover px-6 py-2 text-xs font-bold text-white shadow-sm transition-all font-sora cursor-pointer whitespace-nowrap"
            >
              Browse Events
            </button>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE EVENTS CATALOG */}
      <section id="explore-events" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 relative">
        <div className="absolute right-1/4 bottom-1/4 w-80 h-80 rounded-full bg-rust/5 blur-[100px] pointer-events-none" />

        {/* Catalog Header with Unified Filtering */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 pb-6 border-b border-navy-border/40">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-playfair">Upcoming Events</h2>
            <p className="text-xs text-navy-muted mt-1">Showing {events.length} results</p>
          </div>
          
          {/* Quick Date and Sort Options */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-navy-card/50 border border-navy-border/50 rounded-lg p-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none font-sans cursor-pointer"
              />
              <span className="text-[10px] text-navy-muted uppercase font-bold px-1">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none font-sans cursor-pointer"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-navy-border bg-navy-card/50 py-2 px-3 text-xs text-white focus:border-rust focus:outline-none cursor-pointer transition-colors font-sans"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="location">Sort by Location</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-lg border border-navy-border bg-navy-card/50 py-2 px-3 text-xs text-white focus:border-rust focus:outline-none cursor-pointer transition-colors font-sans"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-navy-muted hover:text-rust transition-colors cursor-pointer px-2"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-400 font-sans">
            <span>{error}</span>
          </div>
        )}

        {/* Events Grid Catalog */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-lg border border-navy-border bg-navy-card animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center overflow-hidden border border-navy-border/60 rounded-xl bg-navy-card/60 backdrop-blur-md shadow-lg max-w-xl mx-auto my-8 font-sans">
            <img
              src="/event_meetup.png"
              alt="No events found"
              className="w-full h-40 object-cover border-b border-navy-border/40 mb-6"
            />
            <div className="px-6 pb-6">
              <h3 className="text-lg font-bold text-white font-playfair mb-2">No Events Found</h3>
              <p className="text-xs text-navy-muted max-w-sm mx-auto mb-6 leading-relaxed">
                We couldn't find any events matching your search or filters. Try adjusting your dates or clearing your search criteria.
              </p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-md bg-rust hover:bg-rust-hover px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rust/10 transition-all font-sora cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col justify-between rounded-2xl border border-navy-border/80 bg-navy-card/85 hover:border-rust/50 hover:shadow-[0_12px_30px_-10px_rgba(217,93,57,0.22)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden shadow-lg shadow-black/40 font-sans"
              >
                <div className="overflow-hidden relative h-36 w-full">
                  <img
                    src={getEventImage(event)}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-end items-center mb-2">
                      <span className="inline-flex items-center gap-1 rounded bg-rust/10 border border-rust/20 px-2 py-0.5 text-xs font-semibold text-rust">
                        <Users className="h-3 w-3" />
                        <span>{event.participant_count || 0} registered</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1 hover:text-rust transition-colors font-playfair">{event.name}</h3>
                    <p className="text-xs text-navy-muted mb-4 line-clamp-2 leading-relaxed font-sans">{event.description}</p>
                    
                    <div className="space-y-1.5 text-xs text-navy-muted/80 font-sans">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-rust shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rust shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-navy-border/50 flex justify-between items-center text-xs">
                    <span className="text-navy-muted font-sans">By <strong className="text-white font-medium">{event.owner_name}</strong></span>
                    <Link
                      href={`/events/${event.id}`}
                      className="font-bold text-rust hover:text-rust-hover hover:underline transition-colors font-sora"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. BOTTOM CTA BANNER */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-navy-border/80 bg-gradient-to-br from-navy-card/85 to-navy-bg/50 p-8 md:p-12 text-center overflow-hidden shadow-xl shadow-black/30">
          <div className="absolute inset-0 bg-grid-navy mask-radial-fade opacity-30 pointer-events-none" />
          {/* subtle ambient glow inside card */}
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-rust/5 blur-[50px] pointer-events-none" />
          
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white font-playfair tracking-wide">
              Ready to host your own event?
            </h2>
            <p className="text-sm text-navy-muted leading-relaxed font-sans">
              Create an account, publish your schedule, and manage participant registrations directly from your personalized dashboard.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              {user ? (
                <Link
                  href="/events/create"
                  className="rounded-full bg-rust hover:bg-rust-hover px-6 py-3 text-xs font-bold text-white shadow-md shadow-rust/10 transition-all"
                >
                  Create an Event
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-full bg-rust hover:bg-rust-hover px-6 py-3 text-xs font-bold text-white shadow-md shadow-rust/10 transition-all"
                  >
                    Sign Up Now
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-navy-border bg-navy-card/40 hover:bg-navy-card/85 px-6 py-3 text-xs font-bold text-white transition-all"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
