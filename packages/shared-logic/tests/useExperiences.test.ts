// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExperiences } from '../src/hooks/useExperiences';

vi.mock('../src/services/experienceService', () => ({
  experienceService: {
    getApprovedExperiences: vi.fn(() => Promise.resolve({ data: [{ id: '1', name: 'Exp 1' }], error: null })),
    getUpcomingEvents: vi.fn(() => Promise.resolve({ data: [{ id: '1', date: '2026-07-20', experience_id: '1' }], error: null })),
  }
}));

describe('useExperiences', () => {
  it('should fetch experiences and events on mount', async () => {
    const { result } = renderHook(() => useExperiences());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.experiences).toEqual([
      {
        id: '1',
        name: 'Exp 1',
        host: undefined,
        hostAvatar: 'https://via.placeholder.com/100',
        category: undefined,
        imageUrl: 'https://via.placeholder.com/500',
        rating: 5,
        reviewsCount: 0,
        price: undefined,
        duration: undefined,
        location: undefined,
        city: 'Guadalajara',
        nextDate: new Date('2026-07-20').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
        description: '',
        longDescription: '',
        whatsAppLink: '',
        images: [],
        reservationInfo: '',
        nextEventId: '1',
        lat: undefined,
        lng: undefined,
      }
    ]);
    expect(result.current.error).toBeNull();
  });
});
