'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { z } from 'zod';
import Link from 'next/link';

const eventFormSchema = z.object({
  name: z.string().min(2, { message: 'Event name must be at least 2 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'A valid date is required' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters long' }),
  imageUrl: z.string().url({ message: 'Invalid image URL format' }).optional().or(z.literal(''))
});

export default function EditEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  
  const [imageMode, setImageMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState('/event_hackathon.png');
  const [customUrl, setCustomUrl] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isMountedRef = useRef(true);

  const presets = [
    { name: 'Hackathon', url: '/event_hackathon.png', label: 'Hackathon / Code' },
    { name: 'Meetup', url: '/event_meetup.png', label: 'Meetup / Networking' },
    { name: 'Conference', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60', label: 'Tech Talk' },
    { name: 'Social', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60', label: 'Social' },
  ];

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchEvent = async () => {
      try {
        const res = await api.getEventById(eventId);
        if (res.event.owner_id !== user.id) {
          if (isMountedRef.current) {
            setApiError('Forbidden. You do not own this event.');
            setLoading(false);
          }
          return;
        }

        if (isMountedRef.current) {
          setName(res.event.name);
          setDescription(res.event.description);
          const formattedDate = new Date(res.event.date).toISOString().split('T')[0];
          setDate(formattedDate);
          setLocation(res.event.location);
          
          const eventImg = res.event.image_url || '';
          const isPresetImg = presets.some(p => p.url === eventImg);
          if (isPresetImg || !eventImg) {
            setImageMode('preset');
            setSelectedPreset(eventImg || '/event_hackathon.png');
            setCustomUrl('');
          } else {
            setImageMode('custom');
            setSelectedPreset('/event_hackathon.png');
            setCustomUrl(eventImg);
          }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          setApiError(err.message || 'Failed to load event details.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    if (!isNaN(eventId)) {
      fetchEvent();
    } else {
      if (isMountedRef.current) {
        setApiError('Invalid Event ID');
        setLoading(false);
      }
    }
  }, [eventId, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const imageUrl = imageMode === 'preset' ? selectedPreset : customUrl;
    const formData = { name, description, date, location, imageUrl };
    const result = eventFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.updateEvent(eventId, result.data);
      router.push(`/events/${eventId}`);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPageLoading = authLoading || loading;

  if (isPageLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-navy-bg text-navy-muted font-sans">
        <span>Loading...</span>
      </div>
    );
  }

  if (apiError && !name) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-navy-bg text-white p-8 font-sans">
        <h3 className="text-xl font-bold text-red-400 mb-2 font-sora">Error</h3>
        <p className="text-navy-muted text-sm mb-6">{apiError}</p>
        <Link href="/" className="rounded-md bg-rust px-4 py-2 text-sm font-semibold text-white font-sora">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-white font-sans">
      <div className="mb-6">
        <Link href={`/events/${eventId}`} className="text-xs font-bold text-rust hover:text-rust-hover font-sora">
          &larr; Back to Event
        </Link>
      </div>

      <div className="rounded-lg border border-navy-border bg-navy-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-6 font-sora">Edit Event</h2>

        {apiError && (
          <div className="mb-4 rounded-md border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="name">
              Event Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
              required
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
              required
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-muted mb-2">
              Event Image
            </label>
            
            {/* Tab Mode Toggle */}
            <div className="flex gap-2 p-1 bg-navy-bg rounded-lg border border-navy-border/60 max-w-xs mb-4">
              <button
                type="button"
                onClick={() => setImageMode('preset')}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                  imageMode === 'preset'
                    ? 'bg-rust text-white shadow-sm'
                    : 'text-navy-muted hover:text-white'
                }`}
              >
                Theme Preset
              </button>
              <button
                type="button"
                onClick={() => setImageMode('custom')}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                  imageMode === 'custom'
                    ? 'bg-rust text-white shadow-sm'
                    : 'text-navy-muted hover:text-white'
                }`}
              >
                Custom URL
              </button>
            </div>

            {/* Preset Selection (No URL input shown!) */}
            {imageMode === 'preset' && (
              <div>
                <span className="block text-[10px] font-semibold text-navy-muted mb-2 uppercase tracking-wider">
                  Select a theme:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPreset(preset.url)}
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer bg-navy-bg/50 ${
                        selectedPreset === preset.url
                          ? 'border-rust shadow-[0_0_8px_rgba(217,93,57,0.3)]'
                          : 'border-navy-border/60 hover:border-navy-border hover:bg-navy-bg'
                      }`}
                    >
                      <div className="w-full h-12 rounded overflow-hidden mb-1 relative">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-white">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom URL Option */}
            {imageMode === 'custom' && (
              <div className="space-y-2">
                <input
                  id="imageUrl"
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
                  placeholder="Paste custom Unsplash or image URL..."
                />
                <p className="text-[10px] text-navy-muted">
                  Paste any direct link to an image (JPEG, PNG, WebP) to use it as the event cover.
                </p>
                {errors.imageUrl && <p className="mt-1 text-xs text-red-400">{errors.imageUrl}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="date">
                Event Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
                required
              />
              {errors.date && <p className="mt-1 text-xs text-red-400">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-muted mb-1" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-navy-border bg-navy-bg py-2 px-3 text-sm text-white focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30 transition-colors"
                required
              />
              {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-navy-border flex justify-end space-x-3">
            <Link
              href={`/events/${eventId}`}
              className="rounded-md border border-navy-border bg-navy-bg px-4 py-2 text-sm font-bold text-navy-muted hover:text-white hover:bg-navy-card font-sora"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-rust hover:bg-rust-hover px-4 py-2 text-sm font-bold text-white shadow-sm transition-all cursor-pointer font-sora"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
