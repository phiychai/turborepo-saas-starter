import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '~/composables/useAuth';

// Mock $fetch
global.$fetch = vi.fn();

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth state and methods', () => {
    const { user, loading, isAuthenticated, isAdmin, login, logout } = useAuth();

    expect(user).toBeDefined();
    expect(loading).toBeDefined();
    expect(isAuthenticated).toBeDefined();
    expect(isAdmin).toBeDefined();
    expect(typeof login).toBe('function');
    expect(typeof logout).toBe('function');
  });

  it('isAuthenticated is false when user is null', () => {
    const { isAuthenticated } = useAuth();
    expect(isAuthenticated.value).toBe(false);
  });

  it('isAdmin is false when user is not admin', () => {
    const { isAdmin } = useAuth();
    expect(isAdmin.value).toBe(false);
  });
});
