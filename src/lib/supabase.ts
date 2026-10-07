/**
 * Supabase client, configured for React Native session persistence.
 *
 * Supabase is the IDENTITY PROVIDER ONLY. No business data lives in Supabase —
 * the backend (Railway Postgres) owns all of that. We only use Supabase for
 * auth; its access token is attached to backend requests by src/lib/api.ts.
 *
 * The session is persisted in the device keystore via a large-value-safe
 * SecureStore adapter (see secure-store.ts).
 */

import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import { config } from '@/config';
import { secureStoreAdapter } from './secure-store';

// supabase-js throws if the key is falsy. Until the publishable key is filled in
// (.env), fall back to a harmless placeholder so module import doesn't crash the
// app before the startup config gate (see app/_layout.tsx) can render a clear
// error. Real auth calls only happen once the key is set.
const supabaseKey = config.supabasePublishableKey || 'missing-publishable-key';

export const supabase = createClient(config.supabaseUrl || 'https://missing.supabase.co', supabaseKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection in a native app (not a web redirect flow).
    detectSessionInUrl: false,
  },
});

// Drive token auto-refresh with app foreground/background, per Supabase's
// React Native guidance: refresh while active, pause while backgrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
