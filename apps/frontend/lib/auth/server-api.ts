import type { Habit, HabitCompletion } from '@/lib/typeDefinitions';
import { getAccessToken } from './cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApiServer<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
        errorMessage = String(errorData.message);
      }
    } catch {
      // Failed to parse error response
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface CreateHabitDto {
  name: string;
  type: 'good' | 'bad';
  description?: string;
}

export interface UpdateHabitDto {
  name?: string;
  type?: 'good' | 'bad';
  description?: string;
}

export interface CreateCheckinDto {
  habitId: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}

// Server-side Auth API
export const serverAuthApi = {
  async getMe(): Promise<User> {
    return fetchApiServer<User>('/auth/me');
  },
};

// Server-side Habits API
export const serverHabitsApi = {
  async getAll(): Promise<Habit[]> {
    return fetchApiServer<Habit[]>('/habits');
  },

  async getOne(id: string): Promise<Habit> {
    return fetchApiServer<Habit>(`/habits/${id}`);
  },

  async create(data: CreateHabitDto): Promise<Habit> {
    return fetchApiServer<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateHabitDto): Promise<Habit> {
    return fetchApiServer<Habit>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApiServer<void>(`/habits/${id}`, {
      method: 'DELETE',
    });
  },
};

// Server-side Checkins API
export const serverCheckinsApi = {
  async getByHabit(habitId: string): Promise<HabitCompletion[]> {
    return fetchApiServer<HabitCompletion[]>(`/checkins/habit/${habitId}`);
  },

  async create(data: CreateCheckinDto): Promise<HabitCompletion> {
    return fetchApiServer<HabitCompletion>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(habitId: string, date: string): Promise<void> {
    return fetchApiServer<void>(`/checkins/habit/${habitId}/date/${date}`, {
      method: 'DELETE',
    });
  },

  async toggle(habitId: string, date: string, completed: boolean): Promise<void> {
    if (completed) {
      await serverCheckinsApi.create({ habitId, date });
    } else {
      await serverCheckinsApi.delete(habitId, date);
    }
  },
};

export { ApiError };




