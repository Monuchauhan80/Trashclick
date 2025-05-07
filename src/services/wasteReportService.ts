import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.https://whxbexcahybryrcljdgc.supabase.co;
const supabaseKey = process.env.JhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeGJleGNhaHlicnlyY2xqZGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2MjczNzMsImV4cCI6MjA1ODIwMzM3M30.cUbjSz__cfl-hkMzNJdQ58sKQud06oOODt2NdoXQ-l0;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface WasteReportData {
  title: string;
  description: string;
  waste_type: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  user_id: string;
}

/**
 * Submit a new waste report to Supabase
 */
export const submitWasteReport = async (reportData: WasteReportData) => {
  try {
    // Insert the report data
    const { data, error } = await supabase
      .from('waste_reports')
      .insert({
        title: reportData.title,
        description: reportData.description,
        waste_type: reportData.waste_type,
        location: reportData.location,
        address: reportData.address,
        user_id: reportData.user_id,
        status: 'reported',
        reported_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Error submitting waste report:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception submitting waste report:', error);
    return { success: false, error };
  }
};

/**
 * Get all waste reports
 */
export const getWasteReports = async () => {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .order('reported_at', { ascending: false });

    if (error) {
      console.error('Error fetching waste reports:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception fetching waste reports:', error);
    return { success: false, error };
  }
};

/**
 * Get waste reports by user ID
 */
export const getUserWasteReports = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .eq('user_id', userId)
      .order('reported_at', { ascending: false });

    if (error) {
      console.error('Error fetching user waste reports:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception fetching user waste reports:', error);
    return { success: false, error };
  }
};

/**
 * Update a waste report status
 */
export const updateWasteReportStatus = async (reportId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .update({ status })
      .eq('id', reportId)
      .select();

    if (error) {
      console.error('Error updating waste report status:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception updating waste report status:', error);
    return { success: false, error };
  }
};

export default {
  submitWasteReport,
  getWasteReports,
  getUserWasteReports,
  updateWasteReportStatus,
};