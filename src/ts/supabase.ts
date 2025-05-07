import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check if Supabase is connected
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Simple query to check connection
    const { data, error } = await supabase.from('waste_reports').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
} 