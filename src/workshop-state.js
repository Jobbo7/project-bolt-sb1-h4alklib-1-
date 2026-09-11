export async function loadWorkshopState(client, ownerId) {
  if (!client || !ownerId) return null;

  const { data, error } = await client
    .from('workshop_state')
    .select('state')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) throw error;
  return data?.state && typeof data.state === 'object' ? data.state : {};
}

export async function saveWorkshopState(client, ownerId, state) {
  if (!client || !ownerId || !state || typeof state !== 'object') return false;

  const { error } = await client
    .from('workshop_state')
    .upsert({
      owner_id: ownerId,
      state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'owner_id' });

  if (error) throw error;
  return true;
}
