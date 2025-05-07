import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and public anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Report waste
export const submitWasteReport = async (reportData: any) => {
  try {
    // First, store images if they exist
    let imageUrls = [];
    
    if (reportData.images && reportData.images.length > 0) {
      for (const image of reportData.images) {
        const fileName = `${reportData.userId}/${Date.now()}-${image.name}`;
        const { data, error } = await supabase.storage
          .from('waste-images')
          .upload(fileName, image);
          
        if (error) throw error;
        
        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('waste-images')
          .getPublicUrl(fileName);
          
        imageUrls.push(urlData.publicUrl);
      }
    }
    
    // Store report data
    const { data, error } = await supabase
      .from('waste_reports')
      .insert({
        title: reportData.title,
        description: reportData.description,
        location: reportData.location,
        address: reportData.address,
        waste_type: reportData.wasteType,
        urgency_level: reportData.urgencyLevel,
        image_urls: imageUrls,
        user_id: reportData.userId,
        status: 'reported',
        reported_at: new Date().toISOString(),
      })
      .select();
      
    if (error) throw error;
    return { success: true, data };
    
  } catch (error) {
    console.error('Error submitting waste report:', error);
    return { success: false, error };
  }
};

// Get waste reports
export const getWasteReports = async () => {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .order('reported_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
    
  } catch (error) {
    console.error('Error fetching waste reports:', error);
    return { success: false, error };
  }
};

// Get user waste reports
export const getUserWasteReports = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .eq('user_id', userId)
      .order('reported_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
    
  } catch (error) {
    console.error('Error fetching user waste reports:', error);
    return { success: false, error };
  }
}; 