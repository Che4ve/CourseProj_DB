import type {
  Habit,
  HabitCheckin,
  HabitSchedule,
  HabitTag,
  Reminder,
  TagWithOwnership,
  UserProfileResponse,
} from '@/lib/typeDefinitions';

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
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface CreateHabitDto {
  name: string;
  type: 'good' | 'bad';
  description?: string;
  priority?: number;
}

export interface UpdateHabitDto {
  name?: string;
  type?: 'good' | 'bad';
  description?: string;
  priority?: number;
  isArchived?: boolean;
}

export interface CreateCheckinDto {
  habitId: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  moodRating?: number;
  durationMinutes?: number;
}

export interface UpdateCheckinDto {
  notes?: string | null;
  moodRating?: number | null;
  durationMinutes?: number | null;
}

export interface CreateTagDto {
  name: string;
}

export interface UpdateTagDto {
  name?: string;
}

export interface CreateScheduleDto {
  habitId: string;
  frequencyType: string;
  frequencyValue?: number;
  weekdaysMask?: number;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
}

export interface UpdateScheduleDto {
  frequencyType?: string;
  frequencyValue?: number;
  weekdaysMask?: number;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

export interface CreateReminderDto {
  habitId: string;
  reminderTime: string;
  daysOfWeek?: number;
  notificationText?: string;
  deliveryMethod?: string;
  isActive?: boolean;
}

export interface UpdateReminderDto {
  reminderTime?: string;
  daysOfWeek?: number;
  notificationText?: string;
  deliveryMethod?: string;
  isActive?: boolean;
}

export interface UpdateProfileDto {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  timezone?: string;
  dateOfBirth?: string | null;
  notificationEnabled?: boolean;
  themePreference?: number;
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
  async getByHabit(habitId: string): Promise<HabitCheckin[]> {
    return fetchApi<HabitCheckin[]>(`/checkins/habit/${habitId}`);
  },

  async create(data: CreateCheckinDto): Promise<HabitCheckin> {
    return fetchApi<HabitCheckin>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(habitId: string, date: string): Promise<void> {
    return fetchApi<void>(`/checkins/habit/${habitId}/date/${date}`, {
      method: 'DELETE',
    });
  },

  async update(habitId: string, date: string, data: UpdateCheckinDto): Promise<HabitCheckin> {
    return fetchApi<HabitCheckin>(`/checkins/habit/${habitId}/date/${date}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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

// Tags API
export const tagsApi = {
  async getAll(): Promise<TagWithOwnership[]> {
    return fetchApi<TagWithOwnership[]>('/tags');
  },

  async create(data: CreateTagDto): Promise<TagWithOwnership> {
    return fetchApi<TagWithOwnership>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateTagDto): Promise<TagWithOwnership> {
    return fetchApi<TagWithOwnership>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/tags/${id}`, {
      method: 'DELETE',
    });
  },

  async attach(tagId: string, habitId: string): Promise<HabitTag> {
    return fetchApi<HabitTag>(`/tags/${tagId}/habits/${habitId}`, {
      method: 'POST',
    });
  },

  async detach(tagId: string, habitId: string): Promise<void> {
    return fetchApi<void>(`/tags/${tagId}/habits/${habitId}`, {
      method: 'DELETE',
    });
  },
};

// Schedules API
export const schedulesApi = {
  async getByHabit(habitId: string): Promise<HabitSchedule[]> {
    return fetchApi<HabitSchedule[]>(`/schedules/habit/${habitId}`);
  },

  async create(data: CreateScheduleDto): Promise<HabitSchedule> {
    return fetchApi<HabitSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateScheduleDto): Promise<HabitSchedule> {
    return fetchApi<HabitSchedule>(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  },
};

// Reminders API
export const remindersApi = {
  async getByHabit(habitId: string): Promise<Reminder[]> {
    return fetchApi<Reminder[]>(`/reminders/habit/${habitId}`);
  },

  async create(data: CreateReminderDto): Promise<Reminder> {
    return fetchApi<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateReminderDto): Promise<Reminder> {
    return fetchApi<Reminder>(`/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },
};

// Profile API
export const profileApi = {
  async getProfile(): Promise<UserProfileResponse> {
    return fetchApi<UserProfileResponse>('/users/profile');
  },

  async updateProfile(data: UpdateProfileDto): Promise<UserProfileResponse> {
    return fetchApi<UserProfileResponse>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Reports API
export const reportsApi = {
  async getHabitsReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return fetchApi<Array<{
      habit_id: string;
      habit_name: string;
      habit_type: string;
      total_checkins: number;
      completion_rate: number;
      last_checkin: string | null;
    }>>(`/reports/habits${query ? `?${query}` : ''}`);
  },

  async getDailyStats(days?: number) {
    const query = days ? `?days=${days}` : '';
    return fetchApi<Array<{
      date: string;
      total_checkins: number;
      unique_habits: number;
      avg_mood: number | null;
      total_duration: number | null;
    }>>(`/reports/daily-stats${query}`);
  },

  async getCompletionRate(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return fetchApi<{ completionRate: number }>(`/reports/completion-rate${query ? `?${query}` : ''}`);
  },

  async getStreaks() {
    return fetchApi<Array<{
      habit_id: string;
      habit_name: string;
      current_streak: number;
      longest_streak: number;
      last_checkin: string | null;
    }>>('/reports/streaks');
  },
};

export { ApiError };


