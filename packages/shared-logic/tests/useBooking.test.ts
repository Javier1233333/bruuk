// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBooking } from '../src/hooks/useBooking';

vi.mock('../src/services/experienceService', () => ({
  experienceService: {
    createBooking: vi.fn((data: any) => {
      if (data.fail) {
        return Promise.resolve({ data: null, error: new Error('Booking failed') });
      }
      return Promise.resolve({ data: { id: 'booking123' }, error: null });
    })
  }
}));

describe('useBooking', () => {
  it('should initialize with loading: false and error: null', () => {
    const { result } = renderHook(() => useBooking());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create booking successfully', async () => {
    const { result } = renderHook(() => useBooking());

    let res;
    await act(async () => {
      res = await result.current.createBooking({ event_id: 'event1' });
    });

    expect(result.current.loading).toBe(false);
    expect(res).toEqual({ success: true, data: { id: 'booking123' } });
    expect(result.current.error).toBeNull();
  });

  it('should fail to create booking', async () => {
    const { result } = renderHook(() => useBooking());

    let res;
    await act(async () => {
      res = await result.current.createBooking({ fail: true });
    });

    expect(result.current.loading).toBe(false);
    expect(res.success).toBe(false);
    expect(result.current.error).toBeDefined();
  });
});
