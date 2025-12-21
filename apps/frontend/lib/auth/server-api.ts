import type {
  Habit,
  HabitCheckin,
  HabitSchedule,
  HabitTag,
  Reminder,
  Tag,
  UserProfileResponse,
} from '@/lib/typeDefinitions';
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
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile: UserProfileResponse['profile'] | null;
}

export interface CreateHabitDto {
  name: string;
  type: 'good' | 'bad';
  description?: string;
  color?: string;
  priority?: number;
}

export interface UpdateHabitDto {
  name?: string;
  type?: 'good' | 'bad';
  description?: string;
  color?: string;
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

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
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
  async getByHabit(habitId: string): Promise<HabitCheckin[]> {
    return fetchApiServer<HabitCheckin[]>(`/checkins/habit/${habitId}`);
  },

  async create(data: CreateCheckinDto): Promise<HabitCheckin> {
    return fetchApiServer<HabitCheckin>('/checkins', {
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

// Server-side Tags API
export const serverTagsApi = {
  async getAll(): Promise<Tag[]> {
    return fetchApiServer<Tag[]>('/tags');
  },

  async create(data: CreateTagDto): Promise<Tag> {
    return fetchApiServer<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateTagDto): Promise<Tag> {
    return fetchApiServer<Tag>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApiServer<void>(`/tags/${id}`, {
      method: 'DELETE',
    });
  },

  async attach(tagId: string, habitId: string): Promise<HabitTag> {
    return fetchApiServer<HabitTag>(`/tags/${tagId}/habits/${habitId}`, {
      method: 'POST',
    });
  },

  async detach(tagId: string, habitId: string): Promise<void> {
    return fetchApiServer<void>(`/tags/${tagId}/habits/${habitId}`, {
      method: 'DELETE',
    });
  },
};

// Server-side Schedules API
export const serverSchedulesApi = {
  async getByHabit(habitId: string): Promise<HabitSchedule[]> {
    return fetchApiServer<HabitSchedule[]>(`/schedules/habit/${habitId}`);
  },

  async create(data: CreateScheduleDto): Promise<HabitSchedule> {
    return fetchApiServer<HabitSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateScheduleDto): Promise<HabitSchedule> {
    return fetchApiServer<HabitSchedule>(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApiServer<void>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  },
};

// Server-side Reminders API
export const serverRemindersApi = {
  async getByHabit(habitId: string): Promise<Reminder[]> {
    return fetchApiServer<Reminder[]>(`/reminders/habit/${habitId}`);
  },

  async create(data: CreateReminderDto): Promise<Reminder> {
    return fetchApiServer<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateReminderDto): Promise<Reminder> {
    return fetchApiServer<Reminder>(`/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApiServer<void>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },
};

// Server-side Profile API
export const serverProfileApi = {
  async getProfile(): Promise<UserProfileResponse> {
    return fetchApiServer<UserProfileResponse>('/users/profile');
  },

  async updateProfile(data: UpdateProfileDto): Promise<UserProfileResponse> {
    return fetchApiServer<UserProfileResponse>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Server-side Reports API
export const serverReportsApi = {
  async getHabitsReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return fetchApiServer<Array<{
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
    return fetchApiServer<Array<{
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
    return fetchApiServer<{ completionRate: number }>(`/reports/completion-rate${query ? `?${query}` : ''}`);
  },

  async getStreaks() {
    return fetchApiServer<Array<{
      habit_id: string;
      habit_name: string;
      current_streak: number;
      longest_streak: number;
      last_checkin: string | null;
    }>>('/reports/streaks');
  },
};

export { ApiError };




