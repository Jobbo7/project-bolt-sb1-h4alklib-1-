export const ADMIN_DEMO_EMAIL = 'admin@partsforge.test';

export function isAdminDemoAccount(auth) {
  return auth?.role === 'ADMIN' &&
    String(auth?.user?.email || '').trim().toLowerCase() === ADMIN_DEMO_EMAIL;
}

export function rejectAdminDemoMutation(auth, res) {
  if (!isAdminDemoAccount(auth)) return false;
  res.status(403).json({
    error: 'ADMIN_DEMO_MODE_MUTATION_BLOCKED',
    message: 'Demo mode uses live read-only data. No production changes were made.',
  });
  return true;
}
