import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompletions, setCompletion } from '@/app/actions/completionActions';

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

describe('Completions Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCompletions', () => {
    it('should return completions for a habit', async () => {
      const mockCompletions = [{ id: '1', habit_id: 'habit1', completed_at: '2024-01-01' }];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCompletions, error: null }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      const result = await getCompletions('habit1');

      expect(result).toEqual(mockCompletions);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habit_completions');
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(getCompletions('habit1')).rejects.toThrow('Не авторизован');
    });
  });

  describe('setCompletion', () => {
    it('should create completion using upsert when completed is true', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

      await setCompletion('habit1', '2024-01-01', true);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habit_completions');
      expect(mockUpsert).toHaveBeenCalledWith(
        { habit_id: 'habit1', completed_at: '2024-01-01' },
        { onConflict: 'habit_id, completed_at', ignoreDuplicates: true }
      );
    });

    it('should delete completion when completed is false', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({ delete: mockDelete });

      await setCompletion('habit1', '2024-01-01', false);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habit_completions');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(setCompletion('habit1', '2024-01-01', true)).rejects.toThrow('Не авторизован');
    });

    it('should throw error when date format is invalid', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      await expect(setCompletion('habit1', 'invalid-date', true)).rejects.toThrow(
        'Неверный формат даты'
      );
    });

    it('should throw error when database operation fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      });

      const mockUpsert = vi.fn().mockResolvedValue({ error: { message: 'DB Error' } });

      mockSupabaseClient.from.mockReturnValue({ upsert: mockUpsert });

      await expect(setCompletion('habit1', '2024-01-01', true)).rejects.toThrow('DB Error');
    });
  });
});
