import { describe, it, expect, vi } from 'vitest';
import { useSessionStore } from '../src/stores/sessionStore';

vi.mock('../src/services', () => ({
  authService: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
    signOut: vi.fn(() => Promise.resolve()),
    refreshSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
  },
  userService: {
    getProfile: vi.fn(() => Promise.resolve({ id: '123', first_name: 'Test' })),
  }
}));

describe('sessionStore', () => {
  it('should initialize with null session', () => {
    const state = useSessionStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('should update session and user when setSession is called', () => {
    const dummySession = {
      access_token: 'token',
      token_type: 'bearer',
      expires_in: 3600,
      user: { id: '123', email: 'test@example.com' }
    } as any;

    useSessionStore.getState().setSession(dummySession);

    const state = useSessionStore.getState();
    expect(state.session).toEqual(dummySession);
    expect(state.user).toEqual(dummySession.user);
  });

  it('should clear session on signOut', async () => {
    useSessionStore.getState().setSession({ user: { id: '123' } } as any);
    await useSessionStore.getState().signOut();

    const state = useSessionStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });
});
