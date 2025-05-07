// Supabase Client Setup
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm'

// Supabase configuration
// IMPORTANT: Replace these with your actual Supabase URL and anon key in production
// These are placeholder values for development
const SUPABASE_URL = 'https://whxbexcahybryrcljdgc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeGJleGNhaHlicnlyY2xqZGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2MjczNzMsImV4cCI6MjA1ODIwMzM3M30.cUbjSz__cfl-hkMzNJdQ58sKQud06oOODt2NdoXQ-l0';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check connection and log status
(async function checkConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Connected to Supabase successfully!');
    }
  } catch (err) {
    console.error('Unexpected error checking Supabase connection:', err);
  }
})();

// Database helper functions
export const db = {
  // User profile functions
  async createProfile(user) {
    try {
      if (!user || !user.id) {
        throw new Error('User data is required to create a profile');
      }
      
      const { data, error } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email.split('@')[0],
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          points: 0,
          level: 1,
          role: user.user_metadata?.role || 'user'
        }
      ]);
      
      if (error) throw error;
      
      console.log('Profile created successfully for user:', user.id);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error };
    }
  },
  
  async createProfileIfNotExists(userId, userData = {}) {
    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is the "not found" error, which is expected
        throw checkError;
      }
      
      // If profile exists, return it
      if (existingProfile) {
        return { success: true, data: existingProfile, created: false };
      }
      
      // Create profile if it doesn't exist
      const newProfileData = {
        id: userId,
        email: userData.email || '',
        username: userData.username || userData.email?.split('@')[0] || `user_${Date.now()}`,
        full_name: userData.full_name || '',
        avatar_url: userData.avatar_url || null,
        created_at: new Date().toISOString(),
        points: 0,
        level: 1,
        role: userData.role || 'user'
      };
      
      const { data, error } = await supabase.from('profiles').insert([newProfileData]);
      
      if (error) throw error;
      
      console.log('Profile created for user:', userId);
      return { success: true, data: newProfileData, created: true };
    } catch (error) {
      console.error('Error creating/checking profile:', error);
      return { success: false, error };
    }
  },
  
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  },
  
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  // File storage functions
  async uploadFile(bucket, filePath, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      return { success: true, data: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error };
    }
  },
  
  async deleteFile(bucket, filePath) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error };
    }
  },
  
  // Waste reports functions
  async submitWasteReport(reportData) {
    try {
      const { data, error } = await supabase
        .from('waste_reports')
        .insert([reportData]);
      
      if (error) throw error;
      
      // Add points to user for reporting waste
      await this.addPointsToUser(reportData.user_id, 50, 'Reported waste');
      
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting waste report:', error);
      return { success: false, error };
    }
  },
  
  async getUserWasteReports(userId) {
    try {
      const { data, error } = await supabase
        .from('waste_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user waste reports:', error);
      return [];
    }
  },
  
  async getWasteReportsNearby(lat, lng, radiusKm = 5, limit = 20) {
    try {
      // This assumes you have a function in your database to calculate distance
      // A more realistic implementation would use PostGIS or similar
      const { data, error } = await supabase
        .rpc('get_reports_nearby', { 
          lat: lat,
          lng: lng,
          radius_km: radiusKm
        })
        .limit(limit);
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching nearby waste reports:', error);
      return [];
    }
  },
  
  // Points and badges functions
  async addPointsToUser(userId, points, reason) {
    try {
      // Get current points
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points, level')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      const currentPoints = profile.points || 0;
      const newPoints = currentPoints + points;
      
      // Update points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // Record points history
      const { error: historyError } = await supabase
        .from('points_history')
        .insert([{
          user_id: userId,
          points: points,
          reason: reason,
          created_at: new Date().toISOString()
        }]);
      
      if (historyError) throw historyError;
      
      // Check for level up
      const currentLevel = profile.level || 1;
      const pointsForNextLevel = currentLevel * 500; // Simple level formula
      
      if (newPoints >= pointsForNextLevel) {
        const newLevel = currentLevel + 1;
        
        // Update level
        await supabase
          .from('profiles')
          .update({ level: newLevel })
          .eq('id', userId);
        
        // Award level badge if applicable
        if (newLevel % 5 === 0) { // Every 5 levels
          await this.awardBadge(userId, `level_${newLevel}`);
        }
        
        return { 
          success: true, 
          points: newPoints, 
          levelUp: true, 
          newLevel 
        };
      }
      
      return { success: true, points: newPoints };
    } catch (error) {
      console.error('Error adding points to user:', error);
      return { success: false, error };
    }
  },
  
  async awardBadge(userId, badgeCode) {
    try {
      // Get badge details
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('*')
        .eq('code', badgeCode)
        .single();
      
      if (badgeError) throw badgeError;
      
      if (!badge) {
        throw new Error(`Badge with code ${badgeCode} not found`);
      }
      
      // Check if user already has this badge
      const { data: existingBadge, error: existingError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .single();
      
      if (!existingError && existingBadge) {
        // User already has this badge
        return { success: false, message: 'User already has this badge' };
      }
      
      // Award badge
      const { error: awardError } = await supabase
        .from('user_badges')
        .insert([{
          user_id: userId,
          badge_id: badge.id,
          awarded_at: new Date().toISOString()
        }]);
      
      if (awardError) throw awardError;
      
      // Award points for the badge
      if (badge.points_value > 0) {
        await this.addPointsToUser(userId, badge.points_value, `Earned ${badge.name} badge`);
      }
      
      return { success: true, badge };
    } catch (error) {
      console.error('Error awarding badge:', error);
      return { success: false, error };
    }
  },
  
  async getUserBadges(userId) {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          awarded_at,
          badges (*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item.badges,
        awarded_at: item.awarded_at
      }));
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  },
  
  // Leaderboard functions
  async getLeaderboard(category = 'points', timeframe = 'all-time', page = 1, limit = 20) {
    try {
      // Calculate time filter based on timeframe
      let timeFilter = null;
      if (timeframe !== 'all-time') {
        const now = new Date();
        const dateFilters = {
          'week': new Date(now.setDate(now.getDate() - 7)),
          'month': new Date(now.setDate(now.getDate() - 30)),
          'year': new Date(now.setFullYear(now.getFullYear() - 1))
        };
        timeFilter = dateFilters[timeframe]?.toISOString() || null;
      }
      
      // Build query
      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, points, reports_count, waste_collected, events_participated, badges');
      
      // Apply time filter if needed
      if (timeFilter) {
        query = query.gte('updated_at', timeFilter);
      }
      
      // Apply sorting based on category
      const sortField = {
        'points': 'points',
        'reports': 'reports_count',
        'waste': 'waste_collected',
        'events': 'events_participated'
      }[category] || 'points';
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Execute query
      const { data, error, count } = await query
        .order(sortField, { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return { 
        data: data.map((user, index) => ({ ...user, rank: from + index + 1 })),
        total: count || data.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return { data: [], total: 0, page, limit };
    }
  },
  
  // User settings functions
  async getUserSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Return default settings if none found
      if (!data) {
        return {
          user_id: userId,
          theme: 'system',
          notifications_enabled: true,
          email_notifications: true,
          push_notifications: true,
          language: 'en',
          accessibility_mode: false,
          data_saver_mode: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  },
  
  async updateUserSettings(userId, settings) {
    try {
      // Check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // Update settings with current timestamp
      const updatedSettings = {
        ...settings,
        updated_at: new Date().toISOString()
      };
      
      let result;
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('user_settings')
          .update(updatedSettings)
          .eq('user_id', userId);
      } else {
        // Create new settings
        result = await supabase
          .from('user_settings')
          .insert([{
            user_id: userId,
            ...updatedSettings,
            created_at: new Date().toISOString()
          }]);
      }
      
      if (result.error) throw result.error;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error };
    }
  },
  
  // Messaging functions
  async getConversations(userId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          is_group,
          group_name,
          conversation_members!inner (
            user_id,
            last_read
          ),
          messages (
            id,
            created_at,
            content,
            user_id
          )
        `)
        .eq('conversation_members.user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },
  
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          created_at,
          content,
          user_id,
          is_read,
          attachments
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return data.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },
  
  async sendMessage(conversationId, userId, content, attachments = null) {
    try {
      // Create message
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          user_id: userId,
          content: content,
          created_at: new Date().toISOString(),
          is_read: false,
          attachments: attachments
        }]);
      
      if (error) throw error;
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }
  }
};

// Auth helper functions
export const auth = {
  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser();
  },
  
  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      // Create user profile
      if (data.user) {
        await db.createProfile(data.user);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error };
    }
  },
  
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error };
    }
  },
  
  // Sign in with social provider
  async signInWithProvider(provider) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      return { success: false, error };
    }
  },
  
  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  },
  
  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error };
    }
  },
  
  // Update password
  async updatePassword(password) {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, error };
    }
  }
};

// Initialize real-time subscriptions
export const initRealtime = () => {
  // Subscribe to messages for the current user
  const currentUser = auth.getCurrentUser();
  if (!currentUser) return;
  
  const userId = currentUser.id;
  
  // Subscribe to new messages in user's conversations
  const messagesSubscription = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=in.(
        select conversation_id from conversation_members where user_id='${userId}'
      )`
    }, (payload) => {
      console.log('New message received:', payload);
      // Trigger custom event for new message
      window.dispatchEvent(new CustomEvent('new-message', { detail: payload.new }));
    })
    .subscribe();
  
  // Subscribe to user point changes
  const pointsSubscription = supabase
    .channel('points')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id='${userId}'`
    }, (payload) => {
      if (payload.new.points !== payload.old.points) {
        console.log('Points updated:', payload.new.points);
        // Trigger custom event for points update
        window.dispatchEvent(new CustomEvent('points-update', { detail: {
          oldPoints: payload.old.points,
          newPoints: payload.new.points,
          difference: payload.new.points - payload.old.points
        }}));
      }
    })
    .subscribe();
  
  // Return function to clean up subscriptions
  return () => {
    messagesSubscription.unsubscribe();
    pointsSubscription.unsubscribe();
  };
};

// Export the Supabase client and helpers
export default supabase;

