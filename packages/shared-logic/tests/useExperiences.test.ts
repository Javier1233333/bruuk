// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExperiences } from '../src/hooks/useExperiences';

vi.mock('../src/services/experienceService', () => ({
  experienceService: {
    getApprovedExperiences: vi.fn(() => Promise.resolve({ data: [{ id: '1', title: 'Exp 1' }], error: null })),
    getUpcomingEvents: vi.fn(() => Promise.resolve({ data: [{ id: '1', date: '2026-07-20' }], error: null })),
  }
}));

describe('useExperiences', () => {
  it('should fetch experiences and events on mount', async () => {
    const { result } = renderHook(() => useExperiences());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.experiences).toEqual([{ id: '1', title: 'Exp 1' }]);
    expect(result.current.events).toEqual([{ id: '1', date: '2026-07-20' }]);
    expect(result.current.error).toBeNull();
  });
});
