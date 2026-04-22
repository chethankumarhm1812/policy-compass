import { supabase } from '@/integrations/supabase/client';

type ProfileTable = 'profiles' | 'public_profiles';
type ProfilePayload = Record<string, unknown>;

let cachedProfileTable: ProfileTable | null = null;

function looksLikeMissingTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    message.includes('relation') ||
    message.includes('does not exist')
  );
}

function mapDbRowToAppProfile(row: ProfilePayload | null): ProfilePayload | null {
  if (!row) return null;
  const mapped = { ...row };
  if (mapped.rural !== undefined && mapped.is_rural === undefined) {
    mapped.is_rural = mapped.rural;
  }
  if (mapped.own_land !== undefined && mapped.owns_land === undefined) {
    mapped.owns_land = mapped.own_land;
  }
  return mapped;
}

function mapAppPayloadToLegacyColumns(payload: ProfilePayload): ProfilePayload {
  const mapped = { ...payload };
  if (mapped.is_rural !== undefined && mapped.rural === undefined) {
    mapped.rural = mapped.is_rural;
  }
  if (mapped.owns_land !== undefined && mapped.own_land === undefined) {
    mapped.own_land = mapped.owns_land;
  }
  return mapped;
}

function looksLikeMissingColumnError(error: { message?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("column") &&
    (msg.includes("is_rural") || msg.includes("owns_land") || msg.includes("has_business")) &&
    (msg.includes("does not exist") || msg.includes("not found"))
  );
}

async function canQueryTable(table: ProfileTable): Promise<boolean> {
  const { error } = await (supabase.from(table as never) as any).select('user_id').limit(1);
  return !error;
}

export async function resolveProfileTable(): Promise<ProfileTable> {
  if (cachedProfileTable) return cachedProfileTable;

  if (await canQueryTable('profiles')) {
    cachedProfileTable = 'profiles';
    return cachedProfileTable;
  }

  cachedProfileTable = 'public_profiles';
  return cachedProfileTable;
}

export async function fetchLatestUserProfile(userId: string): Promise<{ data: ProfilePayload | null; error: any }> {
  const primaryTable = await resolveProfileTable();
  let response = await (supabase.from(primaryTable as never) as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!response.error || !looksLikeMissingTableError(response.error)) {
    return { data: mapDbRowToAppProfile(response.data || null), error: response.error };
  }

  const fallbackTable: ProfileTable = primaryTable === 'profiles' ? 'public_profiles' : 'profiles';
  cachedProfileTable = fallbackTable;
  response = await (supabase.from(fallbackTable as never) as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: mapDbRowToAppProfile(response.data || null), error: response.error };
}

export async function fetchUserProfile(userId: string): Promise<{ data: ProfilePayload | null; error: any }> {
  return fetchLatestUserProfile(userId);
}

export async function upsertUserProfile(userId: string, payload: ProfilePayload): Promise<{ error: any }> {
  const table = await resolveProfileTable();
  let response = await (supabase.from(table as never) as any).upsert(
    { user_id: userId, ...payload },
    { onConflict: 'user_id' }
  );

  if (response.error && looksLikeMissingColumnError(response.error)) {
    response = await (supabase.from(table as never) as any).upsert(
      { user_id: userId, ...mapAppPayloadToLegacyColumns(payload) },
      { onConflict: 'user_id' }
    );
  }

  if (!response.error || !looksLikeMissingTableError(response.error)) {
    return { error: response.error };
  }

  const fallbackTable: ProfileTable = table === 'profiles' ? 'public_profiles' : 'profiles';
  cachedProfileTable = fallbackTable;
  let fallbackResponse = await (supabase.from(fallbackTable as never) as any).upsert(
    { user_id: userId, ...payload },
    { onConflict: 'user_id' }
  );
  if (fallbackResponse.error && looksLikeMissingColumnError(fallbackResponse.error)) {
    fallbackResponse = await (supabase.from(fallbackTable as never) as any).upsert(
      { user_id: userId, ...mapAppPayloadToLegacyColumns(payload) },
      { onConflict: 'user_id' }
    );
  }
  return { error: fallbackResponse.error };
}

export async function updateUserProfile(userId: string, payload: ProfilePayload): Promise<{ error: any }> {
  const table = await resolveProfileTable();
  let response = await (supabase.from(table as never) as any).update(payload).eq('user_id', userId);

  if (response.error && looksLikeMissingColumnError(response.error)) {
    response = await (supabase.from(table as never) as any)
      .update(mapAppPayloadToLegacyColumns(payload))
      .eq('user_id', userId);
  }

  if (!response.error || !looksLikeMissingTableError(response.error)) {
    return { error: response.error };
  }

  const fallbackTable: ProfileTable = table === 'profiles' ? 'public_profiles' : 'profiles';
  cachedProfileTable = fallbackTable;
  let fallbackResponse = await (supabase.from(fallbackTable as never) as any).update(payload).eq('user_id', userId);
  if (fallbackResponse.error && looksLikeMissingColumnError(fallbackResponse.error)) {
    fallbackResponse = await (supabase.from(fallbackTable as never) as any)
      .update(mapAppPayloadToLegacyColumns(payload))
      .eq('user_id', userId);
  }
  return { error: fallbackResponse.error };
}
