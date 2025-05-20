
import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

// Use the values from the Supabase integration
const supabaseUrl = 'https://xhwgwwxmzfedaijvgvld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhod2d3d3htemZlZGFpanZndmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTI2NTIsImV4cCI6MjA2Mjk4ODY1Mn0.MifQzoFcX495NcQExQxcjtaUrDnXos5_mlZNOAG2aLI';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
