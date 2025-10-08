import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCompletions, toggleCompletion } from '@/app/actions/completions'

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Completions Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCompletions', () => {
    it('should return completions for a habit', async () => {
      const mockCompletions = [
        { id: '1', habit_id: 'habit1', completed_at: '2024-01-01' },
      ]

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCompletions, error: null }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await getCompletions('habit1')

      expect(result).toEqual(mockCompletions)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habit_completions')
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      await expect(getCompletions('habit1')).rejects.toThrow('Не авторизован')
    })
  })

  describe('toggleCompletion', () => {
    it('should create completion when it does not exist', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'habit1' }, error: null }),
          }),
        }),
      })

      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'habits') {
          return { select: mockSelect }
        }
        if (table === 'habit_completions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: mockInsert,
          }
        }
      })

      const result = await toggleCompletion('habit1', '2024-01-01')

      expect(result).toEqual({ success: true })
    })

    it('should delete completion when it exists', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'habit1' }, error: null }),
          }),
        }),
      })

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'habits') {
          return { select: mockSelect }
        }
        if (table === 'habit_completions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'completion1' }, error: null }),
                }),
              }),
            }),
            delete: mockDelete,
          }
        }
      })

      const result = await toggleCompletion('habit1', '2024-01-01')

      expect(result).toEqual({ success: true })
    })

    it('should return error when habit does not belong to user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } },
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

      const result = await toggleCompletion('habit1', '2024-01-01')

      expect(result).toEqual({ error: 'Привычка не найдена' })
    })
  })
})

