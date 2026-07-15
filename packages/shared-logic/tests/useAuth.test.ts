// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../src/hooks/useAuth';
import { useSessionStore } from '../src/stores/sessionStore';

describe('useAuth', () => {
  it('should expose sessionStore properties', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(true);

    useSessionStore.getState().setSession({ user: { id: 'user123' } } as any);

    const { result: resultUpdated } = renderHook(() => useAuth());
    expect(resultUpdated.current.session).toBeDefined();
    expect(resultUpdated.current.user).toEqual({ id: 'user123' });
  });
});
