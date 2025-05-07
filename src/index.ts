import { createClient } from '@supabase/supabase-js';

// === Configuration ===
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// === Database Connection ===
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === Types ===
interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface WasteReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  waste_type: string;
  description: string;
  image_url: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

interface ReportFilters {
  wasteType?: string;
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  status?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
}

interface ReportData {
  location: {
    lat: number;
    lng: number;
  };
  wasteType: string;
  description: string;
  imageFile?: File;
  userId: string;
}

// === Auth Functions ===
async function loginUser(email: string, password: string): Promise<User | null> {
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
    console.error('Login error:', error);
    return null;
  }
}

async function registerUser(email: string, password: string, name: string): Promise<User | null> {
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
        name: data.user.user_metadata?.name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

async function logoutUser(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) return null;
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name,
      avatar_url: data.user.user_metadata?.avatar_url
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// === Report Functions ===
async function submitWasteReport(data: ReportData): Promise<boolean> {
  try {
    // First upload image if exists
    let imageUrl = null;
    if (data.imageFile) {
      const fileName = `${data.userId}_${Date.now()}_${data.imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('waste-images')
        .upload(fileName, data.imageFile);

      if (uploadError) throw uploadError;
      
      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('waste-images')
        .getPublicUrl(fileName);
      
      imageUrl = urlData.publicUrl;
    }

    // Save report to database
    const { error } = await supabase.from('waste_reports').insert({
      user_id: data.userId,
      latitude: data.location.lat,
      longitude: data.location.lng,
      waste_type: data.wasteType,
      description: data.description,
      image_url: imageUrl,
      status: 'pending', // Initial status
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error submitting waste report:', error);
    return false;
  }
}

async function getWasteReports(filters?: ReportFilters): Promise<WasteReport[]> {
  try {
    let query = supabase.from('waste_reports').select('*');

    // Apply filters
    if (filters) {
      // Filter by waste type
      if (filters.wasteType) {
        query = query.eq('waste_type', filters.wasteType);
      }

      // Filter by status
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Filter by date range
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();

        switch (filters.dateRange) {
          case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        query = query.gte('created_at', startDate.toISOString());
      }
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Filter by location if specified (client-side filtering)
    if (filters?.location && data) {
      return filterReportsByLocation(data, filters.location);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching waste reports:', error);
    return [];
  }
}

function filterReportsByLocation(
  reports: WasteReport[], 
  location: { lat: number; lng: number; radius: number }
): WasteReport[] {
  return reports.filter(report => {
    const distance = calculateDistance(
      location.lat, 
      location.lng, 
      report.latitude, 
      report.longitude
    );
    
    return distance <= location.radius;
  });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

async function updateReportStatus(
  reportId: string, 
  status: 'pending' | 'in_progress' | 'completed'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('waste_reports')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating report status:', error);
    return false;
  }
}

async function getReportStatistics(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}> {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('status');

    if (error) throw error;

    const reports = data || [];
    return {
      total: reports.length,
      pending: reports.filter((r: { status: string }) => r.status === 'pending').length,
      inProgress: reports.filter((r: { status: string }) => r.status === 'in_progress').length,
      completed: reports.filter((r: { status: string }) => r.status === 'completed').length
    };
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    };
  }
}

// === Profile Functions ===
async function updateUserProfile(
  userId: string, 
  updates: { name?: string; avatar?: File }
): Promise<boolean> {
  try {
    const metadata: Record<string, any> = {};
    
    if (updates.name) {
      metadata.name = updates.name;
    }
    
    if (updates.avatar) {
      // Upload avatar to storage
      const fileName = `${userId}_${Date.now()}_${updates.avatar.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, updates.avatar);

      if (uploadError) throw uploadError;
      
      // Get public URL for the avatar
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      metadata.avatar_url = urlData.publicUrl;
    }
    
    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

async function getUserReports(userId: string): Promise<WasteReport[]> {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }
}

// === Theme Management ===
type Theme = 'light' | 'dark';

function getUserPreferredTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  } catch (error) {
    console.error('Error getting user theme:', error);
    return 'light';
  }
}

function saveUserTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
}

// === Utility Functions ===
function formatDate(dateString: string, includeTime: boolean = false): string {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// === Export All Functions ===
export {
  // Auth
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  
  // Reports
  submitWasteReport,
  getWasteReports,
  updateReportStatus,
  getReportStatistics,
  
  // Profile
  updateUserProfile,
  getUserReports,
  
  // Theme
  getUserPreferredTheme,
  saveUserTheme,
  
  // Utils
  formatDate,
  isValidEmail,
  calculateDistance
};

// Initialize the app
async function initApp(): Promise<void> {
  console.log('TrashClick app initialized in TypeScript-only mode');
  
  // Check if user is logged in
  const user = await getCurrentUser();
  if (user) {
    console.log('User is logged in:', user.email);
  } else {
    console.log('No user logged in');
  }
}

// Run the app
initApp().catch(error => {
  console.error('Error initializing app:', error);
}); 