import { supabase } from './supabaseClient';
import { User } from '../types/User';

// Login user
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url
      };
    }
    return null;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Register user
export const registerUser = async (email: string, password: string, name?: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url
      };
    }
    return null;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data } = await supabase.auth.getUser();
    
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    
    if (data.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url
      };
    }
    return null;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}; 