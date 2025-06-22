import { createClient } from '@supabase/supabase-js';

// This file sets up and exports a Supabase client instance using environment variables.
// Use `supabase` to interact with your Supabase backend throughout the app.
// Environment variables required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 