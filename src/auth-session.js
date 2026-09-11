export async function restoreVerifiedUserSession(client) {
  if (!client) return null;

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const user = sessionData?.session?.user;
  if (sessionError || !user) return null;

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('display_name,role,linked_account')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.role) return null;

  return {
    name: profile.display_name || user.email?.split('@')[0] || 'PartsForge user',
    email: user.email || '',
    role: profile.role,
    workshopType: String(user.user_metadata?.workshopType || '').toUpperCase(),
    linkedAccount: profile.linked_account || '',
    technicianId: user.id,
    isEmployeeSubUser: profile.role === 'APPRENTICE',
    signedInAt: new Date().toISOString(),
  };
}
