const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`
  : 'http://localhost:5000/api';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface EventItem {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  image_url?: string;
  created_at: string;
  participant_count?: number;
}

export interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  status: 'registered' | 'cancelled';
  cancellation_reason?: string;
  registered_at: string;
}

export interface Participant {
  registration_id: number;
  status: 'registered' | 'cancelled';
  cancellation_reason?: string;
  registered_at: string;
  user_id: number;
  user_name: string;
  user_email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('event_manager_token');
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  let data: any;

  try {
    response = await fetch(url, config);
    data = await response.json();
  } catch (error: any) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw new Error(error.message || 'Network connection failed.');
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(body: any): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async login(body: any): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  // Events
  async getEvents(params: {
    search?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ events: EventItem[] }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<{ events: EventItem[] }>(`/events${queryString}`);
  },

  async getEventById(id: number): Promise<{ event: EventItem; registration: Registration | null }> {
    return request<{ event: EventItem; registration: Registration | null }>(`/events/${id}`);
  },

  async createEvent(body: any): Promise<{ event: EventItem }> {
    return request<{ event: EventItem }>('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateEvent(id: number, body: any): Promise<{ event: EventItem }> {
    return request<{ event: EventItem }>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async deleteEvent(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Registrations
  async registerForEvent(id: number): Promise<{ registration: Registration }> {
    return request<{ registration: Registration }>(`/events/${id}/register`, {
      method: 'POST',
    });
  },

  async getParticipants(id: number): Promise<{ participants: Participant[] }> {
    return request<{ participants: Participant[] }>(`/events/${id}/participants`);
  },

  async cancelParticipant(eventId: number, userId: number, reason: string): Promise<{ registration: Registration }> {
    return request<{ registration: Registration }>(`/events/${eventId}/participants/${userId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },
};
