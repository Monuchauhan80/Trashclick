import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a browser client (prevents SSR issues)
const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

// Export a singleton instance of Supabase client
export const supabase = createBrowserClient();

// Authentication helper functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  // If sign in is successful, check and initialize database tables
  if (!error && data.user) {
    try {
      await initializeUserProfile(data.user.id, email);
    } catch (e) {
      console.error("Error initializing user profile:", e);
    }
  }
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

// Database initialization
export async function initializeUserProfile(userId: string, email: string) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (!existingProfile) {
    // Create profile if it doesn't exist
    await supabase
      .from('profiles')
      .insert([
        { 
          id: userId,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
  }
}

// Database helper functions for complaints
export async function submitComplaint(complaintData: {
  description: string;
  location: string;
  latitude?: string;
  longitude?: string;
  image_url?: string;
  user_id?: string;
}) {
  const { data, error } = await supabase
    .from('complaints')
    .insert([complaintData])
    .select();
  
  return { data, error };
}

export async function getComplaints() {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getUserComplaints(userId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

// Storage helper functions
export async function uploadImage(filePath: string, file: File) {
  const { data, error } = await supabase.storage
    .from('complaint-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  return { data, error };
}

export async function getImageUrl(filePath: string) {
  const { data } = supabase.storage
    .from('complaint-images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
} 