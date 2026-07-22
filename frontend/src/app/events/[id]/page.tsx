'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, EventItem, Registration } from '@/lib/api';
import { Calendar, MapPin, Users, Mail } from 'lucide-react';
import Link from 'next/link';

export default function EventDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string, 10);

  const [event, setEvent] = useState<EventItem | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchEventDetails = async () => {
    try {
      const res = await api.getEventById(eventId);
      if (isMountedRef.current) {
        setEvent(res.event);
        setRegistration(res.registration);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load event details.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isNaN(eventId)) {
      fetchEventDetails();
    } else {
      if (isMountedRef.current) {
        setError('Invalid Event ID');
        setLoading(false);
      }
    }
  }, [eventId]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setRegistering(true);
    try {
      const res = await api.registerForEvent(eventId);
      setRegistration(res.registration);
      const updated = await api.getEventById(eventId);
      setEvent(updated.event);
    } catch (err: any) {
      alert(err.message || 'Failed to register.');
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteEvent(eventId);
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Failed to delete event.');
      setDeleting(false);
    }
  };

  const getEventImage = (eventItem: EventItem) => {
    if (eventItem.image_url) {
      return eventItem.image_url;
    }
    const lowerName = eventItem.name.toLowerCase();
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const isPageLoading = authLoading || loading;

  if (isPageLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-navy-bg text-navy-muted font-sans">
        <span>Loading event...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-navy-bg text-white p-8 font-sans">
        <h3 className="text-xl font-bold text-red-400 mb-2 font-playfair">Event Not Found</h3>
        <p className="text-navy-muted text-sm mb-6">{error || 'This event does not exist.'}</p>
        <Link href="/" className="rounded-md bg-rust px-4 py-2 text-sm font-semibold text-white font-sora">
          Back to Events
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === event.owner_id;
  const isRegistered = registration?.status === 'registered';
  const isCancelled = registration?.status === 'cancelled';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 text-white font-sans">
      
      <div className="mb-6">
        <Link href="/" className="text-xs font-bold text-rust hover:text-rust-hover font-sora">
          &larr; Back to Events
        </Link>
      </div>

      {/* Cancellation Warning Banner */}
      {isCancelled && (
        <div className="mb-6 rounded-md border border-red-950/30 bg-red-950/20 p-5 text-red-400 font-sans">
          <h4 className="font-bold text-sm font-playfair">Registration Cancelled</h4>
          <p className="mt-1 text-xs text-navy-muted">
            The event organizer has cancelled your registration.
          </p>
          <div className="mt-3 text-xs border-l-2 border-red-500/50 pl-3 italic text-red-300 bg-red-950/40 py-1.5 rounded-r">
            Reason: &ldquo;{registration.cancellation_reason}&rdquo;
          </div>
        </div>
      )}

      {isRegistered && (
        <div className="mb-6 rounded-md border border-emerald-900/30 bg-emerald-950/20 p-4 text-emerald-450 text-xs font-bold font-sora">
          ✓ You are registered to attend this event.
        </div>
      )}

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column (Content) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-navy-border bg-navy-card overflow-hidden shadow-sm">
            <img
              src={getEventImage(event)}
              alt={event.name}
              className="w-full h-64 object-cover"
            />
            
            <div className="p-6">
              {isOwner && (
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded">
                    Organizer (You)
                  </span>
                </div>
              )}

              <h1 className="text-2xl font-bold text-white mb-6 font-playfair">{event.name}</h1>

              <div className="space-y-3 border-y border-navy-border/50 py-4 my-4 text-xs text-navy-muted">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-rust shrink-0" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rust shrink-0" />
                  <span>{event.location}</span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-white mb-2 font-playfair">Description</h3>
                <p className="text-xs text-navy-muted leading-relaxed whitespace-pre-wrap">
                  {event.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Actions) */}
        <div className="space-y-6">
          
          {/* Organizer Card */}
          <div className="rounded-lg border border-navy-border bg-navy-card p-5 shadow-sm">
            <h3 className="text-xs font-bold text-navy-light uppercase tracking-wider mb-3 font-sora">Host</h3>
            <p className="text-sm font-semibold text-white">{event.owner_name}</p>
            <p className="text-xs text-navy-muted mt-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-navy-light" />
              <span className="truncate">{event.owner_email}</span>
            </p>
          </div>

          {/* Action Card */}
          <div className="rounded-lg border border-navy-border bg-navy-card p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-navy-border/50">
              <span className="text-navy-muted font-semibold flex items-center gap-1 font-sora">
                <Users className="h-3.5 w-3.5 text-rust" />
                Participants
              </span>
              <strong className="text-white bg-navy-bg border border-navy-border px-2 py-0.5 rounded text-xs font-sora">
                {event.participant_count || 0}
              </strong>
            </div>

            {isOwner ? (
              <div className="flex flex-col space-y-2 font-sora">
                <Link
                  href={`/events/${event.id}/edit`}
                  className="w-full text-center rounded-md border border-navy-border bg-navy-bg py-2 text-xs font-bold text-white hover:bg-navy-card transition-colors"
                >
                  Edit Event Details
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full text-center rounded-md border border-red-900/30 bg-red-950/20 py-2 text-xs font-bold text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Delete Event'}
                </button>
                <Link
                  href="/dashboard"
                  className="w-full text-center rounded-md bg-rust hover:bg-rust-hover py-2 text-xs font-bold text-white transition-colors"
                >
                  Go to Dashboard &rarr;
                </Link>
              </div>
            ) : isRegistered ? (
              <div className="rounded-md border border-emerald-900/30 bg-emerald-950/20 p-3 text-center text-xs text-emerald-450 font-bold font-sora">
                You are registered for this event.
              </div>
            ) : isCancelled ? (
              <div className="rounded-md border border-red-900/30 bg-red-950/20 p-3 text-center text-xs text-red-450 font-bold font-sora">
                Your registration was cancelled.
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full rounded-md bg-rust hover:bg-rust-hover py-2 text-xs font-bold text-white shadow transition-all cursor-pointer font-sora"
              >
                {registering ? 'Processing...' : user ? 'Register for Event' : 'Log In to Register'}
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
