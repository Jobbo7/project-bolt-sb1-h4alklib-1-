import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreVerifiedUserSession } from '../src/auth-session.js';

function verifiedClient({ user, profile, profileError = null }) {
  return {
    auth: {
      getSession: async () => ({ data: { session: user ? { user } : null }, error: null }),
    },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        single: async () => ({ data: profile, error: profileError }),
      };
    },
  };
}

test('restored dashboard role comes from the verified database profile', async () => {
  const restored = await restoreVerifiedUserSession(verifiedClient({
    user: {
      id: 'user-1',
      email: 'workshop@example.com',
      user_metadata: { role: 'ADMIN', workshopType: 'mechanical' },
    },
    profile: { display_name: 'Workshop', role: 'MECHANIC', linked_account: null },
  }));

  assert.equal(restored.role, 'MECHANIC');
  assert.equal(restored.workshopType, 'MECHANICAL');
  assert.equal(restored.technicianId, 'user-1');
});

test('missing or unverifiable Supabase sessions restore no dashboard access', async () => {
  assert.equal(await restoreVerifiedUserSession(null), null);
  assert.equal(await restoreVerifiedUserSession(verifiedClient({ user: null, profile: null })), null);
  assert.equal(await restoreVerifiedUserSession(verifiedClient({
    user: { id: 'user-1', email: 'user@example.com' },
    profile: null,
    profileError: new Error('unavailable'),
  })), null);
});
