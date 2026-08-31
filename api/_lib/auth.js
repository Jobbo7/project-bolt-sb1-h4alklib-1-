import { createClient } from '@supabase/supabase-js';

export async function requireUser(req, res, allowedRoles = []) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const authorization = req.headers.authorization;
  if (!url || !key) {
    res.status(503).json({ error: 'AUTH_NOT_CONFIGURED' });
    return null;
  }
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
    return null;
  }
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(authorization.slice(7));
  if (error || !data?.user) {
    res.status(401).json({ error: 'INVALID_SESSION' });
    return null;
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (allowedRoles.length && !allowedRoles.includes(profile?.role)) {
    res.status(403).json({ error: 'INSUFFICIENT_ROLE' });
    return null;
  }
  return { user: data.user, role: profile?.role || null, supabase };
}
