import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHabits, createHabit, updateHabit, deleteHabit } from '@/app/actions/habitActions';

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

describe('Habits Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHabits', () => {
    it('should return habits for authenticated user', async () => {
      const mockHabits = [
        {
          id: '1',
          user_id: 'user1',
          name: 'Test Habit',
          type: 'good',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockHabits, error: null }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const result = await getHabits();

      expect(result).toEqual(mockHabits);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habits');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(getHabits()).rejects.toThrow('Не авторизован');
    });
  });

  describe('createHabit', () => {
    it('should create habit with valid data', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

      const formData = new FormData();
      formData.append('name', 'New Habit');
      formData.append('type', 'good');

      await createHabit(formData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habits');
      expect(mockInsert).toHaveBeenCalledWith([
        { user_id: 'user1', name: 'New Habit', type: 'good' },
      ]);
    });

    it('should throw error when fields are missing', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const formData = new FormData();

      await expect(createHabit(formData)).rejects.toThrow('Заполните все поля');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const formData = new FormData();
      formData.append('name', 'New Habit');
      formData.append('type', 'good');

      await expect(createHabit(formData)).rejects.toThrow('Не авторизован');
    });
  });

  describe('updateHabit', () => {
    it('should update habit with valid data', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.from.mockReturnValue({ update: mockUpdate });

      const formData = new FormData();
      formData.append('name', 'Updated Habit');
      formData.append('type', 'bad');

      await updateHabit('1', formData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habits');
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Habit', type: 'bad' });
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const formData = new FormData();
      formData.append('name', 'Updated Habit');
      formData.append('type', 'bad');

      await expect(updateHabit('1', formData)).rejects.toThrow('Не авторизован');
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit successfully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.from.mockReturnValue({ delete: mockDelete });

      await deleteHabit('1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habits');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(deleteHabit('1')).rejects.toThrow('Не авторизован');
    });
  });
});
