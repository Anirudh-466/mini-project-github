import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PLACEHOLDER_URLS = new Set([
  '',
  'https://your-project.supabase.co',
  'http://your-project.supabase.co',
]);

const PLACEHOLDER_KEYS = new Set([
  '',
  'your-anon-key',
  'your-supabase-anon-key-here',
  'placeholder-anon-key',
]);

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured =
  Boolean(rawUrl) &&
  Boolean(rawKey) &&
  !PLACEHOLDER_URLS.has(rawUrl) &&
  !PLACEHOLDER_KEYS.has(rawKey) &&
  (rawUrl.startsWith('https://') || rawUrl.startsWith('http://'));

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
