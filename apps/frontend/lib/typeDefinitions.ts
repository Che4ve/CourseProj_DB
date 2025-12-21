export type HabitType = 'good' | 'bad';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type DeliveryMethod = 'push' | 'email' | 'sms';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  isSystem: boolean;
  createdAt: string;
}

export interface TagWithOwnership extends Tag {
  isOwned: boolean;
}

export interface HabitTag {
  id: string;
  habitId: string;
  tagId: string;
  priority: number;
  isPrimary: boolean;
  assignedBy: string;
  assignedAt: string;
  tag?: Tag;
}

export interface HabitSchedule {
  id: string;
  habitId: string;
  frequencyType: FrequencyType | string;
  frequencyValue: number;
  weekdaysMask: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface Reminder {
  id: string;
  habitId: string;
  reminderTime: string;
  daysOfWeek: number;
  notificationText?: string | null;
  deliveryMethod: DeliveryMethod | string;
  isActive: boolean;
  createdAt: string;
}

export interface HabitStat {
  id: string;
  habitId: string;
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  averageMood?: number | null;
  lastCheckinAt?: string | null;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  type: HabitType;
  priority: number;
  isArchived: boolean;
  displayOrder: number;
  createdAt: string;
  tags?: HabitTag[];
  schedules?: HabitSchedule[];
  reminders?: Reminder[];
  stats?: HabitStat | null;
}

export interface HabitCheckin {
  id: string;
  habitId: string;
  userId: string;
  checkinDate: string;
  checkinTime: string;
  notes?: string | null;
  moodRating?: number | null;
  durationMinutes?: number | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
  timezone: string;
  dateOfBirth?: string | null;
  notificationEnabled: boolean;
  themePreference: number;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile: UserProfile | null;
}
