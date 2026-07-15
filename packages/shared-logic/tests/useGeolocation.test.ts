// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../src/hooks/useGeolocation';
import { setGeoAdapter } from '../src/adapters/geoAdapter';

describe('useGeolocation', () => {
  const mockGeoAdapter = {
    getCurrentPosition: vi.fn(() => Promise.resolve({ latitude: 10, longitude: 20 }))
  };

  beforeEach(() => {
    setGeoAdapter(mockGeoAdapter);
    mockGeoAdapter.getCurrentPosition.mockClear();
  });

  it('should initialize with null position', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.position).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch position when getPosition is called', async () => {
    const { result } = renderHook(() => useGeolocation());

    let posPromise;
    await act(async () => {
      posPromise = result.current.getPosition();
    });

    expect(result.current.position).toEqual({ latitude: 10, longitude: 20 });
  });
});
