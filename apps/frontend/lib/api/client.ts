import type { Habit, HabitCompletion } from '@/lib/typeDefinitions';

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

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send cookies
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

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
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

// Auth API
export const authApi = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    return fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return fetchApi<User>('/auth/me');
  },

  async logout(): Promise<void> {
    // Clear the cookie by making a request that returns 401
    // Or implement a logout endpoint in the backend
    return fetchApi<void>('/auth/logout', {
      method: 'POST',
    });
  },
};

// Habits API
export const habitsApi = {
  async getAll(): Promise<Habit[]> {
    return fetchApi<Habit[]>('/habits');
  },

  async getOne(id: string): Promise<Habit> {
    return fetchApi<Habit>(`/habits/${id}`);
  },

  async create(data: CreateHabitDto): Promise<Habit> {
    return fetchApi<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateHabitDto): Promise<Habit> {
    return fetchApi<Habit>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/habits/${id}`, {
      method: 'DELETE',
    });
  },
};

// Checkins API
export const checkinsApi = {
  async getByHabit(habitId: string): Promise<HabitCompletion[]> {
    return fetchApi<HabitCompletion[]>(`/checkins/habit/${habitId}`);
  },

  async create(data: CreateCheckinDto): Promise<HabitCompletion> {
    return fetchApi<HabitCompletion>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(habitId: string, date: string): Promise<void> {
    return fetchApi<void>(`/checkins/habit/${habitId}/date/${date}`, {
      method: 'DELETE',
    });
  },

  async toggle(habitId: string, date: string, completed: boolean): Promise<void> {
    if (completed) {
      await checkinsApi.create({ habitId, date });
    } else {
      await checkinsApi.delete(habitId, date);
    }
  },
};

export { ApiError };




