import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://vitgqdlredogyfuodnfy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdGdxZGxyZWRvZ3lmdW9kbmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzU4NzUsImV4cCI6MjA5MTExMTg3NX0.cG5pafE6gJ0tsl5lR4qS5CfBrHaMz4YYvKh1uNgAFL8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
