'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, EventItem, Participant } from '@/lib/api';
import { ChevronDown, ChevronUp, X, Ban, Calendar, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [participants, setParticipants] = useState<Record<number, Participant[]>>({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState<Record<number, boolean>>({});
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    eventId: number;
    userId: number;
    userName: string;
    reason: string;
    error: string | null;
    submitting: boolean;
  }>({
    isOpen: false,
    eventId: 0,
    userId: 0,
    userName: '',
    reason: '',
    error: null,
    submitting: false
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchMyEvents = async () => {
    if (!user) return;
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await api.getEvents();
      const myOwnedEvents = res.events.filter(e => e.owner_id === user.id);
      if (isMountedRef.current) {
        setEvents(myOwnedEvents);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch your events.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingEvents(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const toggleEventExpand = async (eventId: number) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      return;
    }

    setExpandedEventId(eventId);
    
    setLoadingParticipants(prev => ({ ...prev, [eventId]: true }));
    try {
      const res = await api.getParticipants(eventId);
      if (isMountedRef.current) {
        setParticipants(prev => ({ ...prev, [eventId]: res.participants }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      if (isMountedRef.current) {
        setLoadingParticipants(prev => ({ ...prev, [eventId]: false }));
      }
    }
  };

  const handleOpenCancelModal = (eventId: number, userId: number, userName: string) => {
    setCancellationModal({
      isOpen: true,
      eventId,
      userId,
      userName,
      reason: '',
      error: null,
      submitting: false
    });
  };

  const handleCloseCancelModal = () => {
    setCancellationModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { eventId, userId, reason } = cancellationModal;
    
    if (reason.trim().length < 3) {
      setCancellationModal(prev => ({ ...prev, error: 'Reason must be at least 3 characters long.' }));
      return;
    }

    setCancellationModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      await api.cancelParticipant(eventId, userId, reason);
      
      setParticipants(prev => {
        const list = prev[eventId] || [];
        const updatedList = list.map(p => {
          if (p.user_id === userId) {
            return {
              ...p,
              status: 'cancelled' as const,
              cancellation_reason: reason
            };
          }
          return p;
        });
        return { ...prev, [eventId]: updatedList };
      });

      handleCloseCancelModal();
    } catch (err: any) {
      setCancellationModal(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err.message || 'Failed to cancel registration.' 
      }));
    }
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

  if (authLoading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-navy-bg text-navy-muted font-sans">
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 text-white font-sans">
      
      <div className="mb-8 flex justify-between items-center pb-6 border-b border-navy-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sora">Dashboard</h1>
          <p className="mt-1 text-sm text-navy-muted">Manage your hosted events and registrations.</p>
        </div>
        <Link
          href="/events/create"
          className="rounded-md bg-rust hover:bg-rust-hover px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors font-sora"
        >
          Create Event
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-900/30 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loadingEvents ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 rounded-md border border-navy-border bg-navy-card animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center overflow-hidden border border-navy-border/60 rounded-xl bg-navy-card/60 backdrop-blur-md shadow-lg max-w-xl mx-auto my-8">
          <img
            src="/event_meetup.png"
            alt="No hosted events"
            className="w-full h-40 object-cover border-b border-navy-border/40 mb-6"
          />
          <div className="px-6 pb-6">
            <h3 className="text-lg font-bold text-white font-sora mb-2">No Hosted Events</h3>
            <p className="text-xs text-navy-muted max-w-sm mx-auto mb-6 leading-relaxed">
              You haven't created any events yet. Organize your first workshop, meetup, or conference and track your participants in real-time.
            </p>
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 rounded-md bg-rust hover:bg-rust-hover px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rust/10 transition-all font-sora cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Host an Event</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id;
            const eventParts = participants[event.id] || [];
            const isPartsLoading = loadingParticipants[event.id];

            return (
              <div
                key={event.id}
                className="rounded-2xl border border-navy-border/80 bg-navy-card/85 hover:border-rust/50 hover:shadow-[0_8px_25px_-5px_rgba(217,93,57,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-lg shadow-black/35"
              >
                {/* Event header row */}
                <div
                  onClick={() => toggleEventExpand(event.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer hover:bg-navy-bg/30 transition-colors gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-rust font-bold">
                        {event.participant_count || 0} registered
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white font-playfair">{event.name}</h3>
                    <p className="text-xs text-navy-muted mt-1">
                      {formatDate(event.date)} &bull; {event.location}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 justify-end">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-xs font-bold text-white border border-navy-border px-3 py-1.5 rounded bg-navy-bg hover:bg-navy-card transition-colors font-sora"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Event
                    </Link>
                    <button className="text-navy-muted hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Participants */}
                {isExpanded && (
                  <div className="border-t border-navy-border bg-navy-bg/25 p-5">
                    <h4 className="text-xs font-bold text-navy-muted uppercase tracking-wider mb-3 font-sora">
                      Participants List
                    </h4>

                    {isPartsLoading ? (
                      <div className="py-4 text-center">
                        <span className="text-xs text-navy-muted animate-pulse">Loading participants...</span>
                      </div>
                    ) : eventParts.length === 0 ? (
                      <p className="text-xs text-navy-muted py-3">
                        No registrations for this event yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-navy-border rounded bg-navy-card">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-navy-border bg-navy-bg/40 text-navy-muted font-bold font-sora">
                              <th className="py-2.5 px-3">Name</th>
                              <th className="py-2.5 px-3">Email</th>
                              <th className="py-2.5 px-3">Date Registered</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventParts.map((p) => {
                              const isPartCancelled = p.status === 'cancelled';
                              return (
                                <tr
                                  key={p.user_id}
                                  className="border-b border-navy-border/30 last:border-0 hover:bg-navy-bg/20"
                                >
                                  <td className="py-3 px-3 font-semibold text-white">
                                    {p.user_name}
                                  </td>
                                  <td className="py-3 px-3 text-navy-muted font-sans">
                                    {p.user_email}
                                  </td>
                                  <td className="py-3 px-3 text-navy-muted">
                                    {new Date(p.registered_at).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-3">
                                    {isPartCancelled ? (
                                      <div>
                                        <span className="inline-flex items-center text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded font-sora">
                                          Cancelled
                                        </span>
                                        {p.cancellation_reason && (
                                          <p className="text-[10px] text-red-500 mt-0.5 italic max-w-xs truncate font-sans">
                                            Reason: {p.cancellation_reason}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded font-sora">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {!isPartCancelled && (
                                      <button
                                        onClick={() => handleOpenCancelModal(event.id, p.user_id, p.user_name)}
                                        className="inline-flex items-center space-x-1 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 hover:border-red-900/40 px-2.5 py-1.2 rounded cursor-pointer transition-colors font-sora"
                                      >
                                        <Ban className="h-3 w-3" />
                                        <span>Cancel</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-navy-border bg-navy-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-navy-border/50 pb-2">
              <h3 className="text-sm font-bold text-white font-sora">Cancel Registration</h3>
              <button
                onClick={handleCloseCancelModal}
                className="text-navy-muted hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cancellationModal.error && (
              <div className="mb-4 rounded-md border border-red-900/30 bg-red-950/20 p-2 text-xs text-red-400">
                {cancellationModal.error}
              </div>
            )}

            <p className="text-xs text-navy-muted mb-4 font-sans">
              Enter the reason for cancelling <strong className="text-white font-sora">{cancellationModal.userName}</strong>'s registration.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="reason">
                  Reason
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  value={cancellationModal.reason}
                  onChange={(e) => setCancellationModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-xs text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
                  placeholder="Reason for cancellation..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-navy-border/50 font-sora">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  className="rounded-md border border-navy-border bg-navy-bg px-3.5 py-1.5 text-xs font-bold text-navy-muted hover:text-white hover:bg-navy-card"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancellationModal.submitting}
                  className="rounded-md bg-red-650 hover:bg-red-700 px-4 py-1.5 text-xs font-bold text-white shadow transition-all cursor-pointer"
                >
                  {cancellationModal.submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
