import { supabase } from './supabase';
import { showNotification } from './utils';

export interface WasteReport {
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

export interface ReportFilters {
  wasteType?: string;
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  status?: string;
  location?: {
    lat: number;
    lng: number;
    radius: number; // in kilometers
  };
}

export interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

// Keep a reference to the current reports for sorting
let currentReports: WasteReport[] = [];

/**
 * Fetch waste reports from the database with optional filters
 */
export async function fetchReports(filters?: ReportFilters): Promise<WasteReport[]> {
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

      // Location-based filtering would be done after fetching the data
      // as Supabase doesn't have built-in geospatial queries
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Filter by location if specified (client-side filtering)
    if (filters?.location) {
      return filterByLocation(data || [], filters.location);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    showNotification('Failed to load waste reports. Please try again.', 'error');
    return [];
  }
}

/**
 * Calculate statistics for reports
 */
export async function getReportStats(): Promise<ReportStats> {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('status');

    if (error) throw error;

    const reports = data || [];
    const stats: ReportStats = {
      total: reports.length,
      pending: reports.filter((r: { status: string }) => r.status === 'pending').length,
      inProgress: reports.filter((r: { status: string }) => r.status === 'in_progress').length,
      completed: reports.filter((r: { status: string }) => r.status === 'completed').length
    };

    return stats;
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

/**
 * Update the waste report statistics in the UI
 */
export function updateReportStatsUI(stats: ReportStats): void {
  const totalElement = document.getElementById('totalReports');
  const pendingElement = document.getElementById('pendingReports');
  const inProgressElement = document.getElementById('inProgressReports');
  const cleanedElement = document.getElementById('cleanedReports');

  if (totalElement) totalElement.textContent = stats.total.toString();
  if (pendingElement) pendingElement.textContent = stats.pending.toString();
  if (inProgressElement) inProgressElement.textContent = stats.inProgress.toString();
  if (cleanedElement) cleanedElement.textContent = stats.completed.toString();
}

/**
 * Render report cards in the reports list
 */
export function renderReportsList(reports: WasteReport[]): void {
  const reportsListElement = document.getElementById('reportsList');
  if (!reportsListElement) return;

  if (reports.length === 0) {
    reportsListElement.innerHTML = `
      <div class="no-reports">
        <p>No reports found with the current filters.</p>
      </div>
    `;
    return;
  }

  reportsListElement.innerHTML = reports.map(report => `
    <div class="report-card" data-id="${report.id}">
      <div class="report-card-header">
        <span class="report-title">${getWasteTypeDisplay(report.waste_type)}</span>
        <span class="report-status ${report.status}">${getStatusDisplay(report.status)}</span>
      </div>
      <div class="report-details">
        ${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}
      </div>
      <div class="report-location">
        <i class="fas fa-map-marker-alt"></i> ${formatLocation(report.latitude, report.longitude)}
      </div>
      <div class="report-date">
        ${formatDate(report.created_at)}
      </div>
    </div>
  `).join('');

  // Add click handlers to report cards
  const reportCards = reportsListElement.querySelectorAll('.report-card');
  reportCards.forEach(card => {
    card.addEventListener('click', () => {
      const reportId = card.getAttribute('data-id');
      if (reportId) {
        highlightReportOnMap(reportId);
      }
    });
  });
}

/**
 * Initialize report filters
 */
export function initReportFilters(): void {
  const applyFiltersBtn = document.getElementById('applyFilters');
  const wasteTypeFilter = document.getElementById('wasteTypeFilter') as HTMLSelectElement;
  const dateRangeFilter = document.getElementById('dateRangeFilter') as HTMLSelectElement;
  const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;
  const sortSelector = document.getElementById('sortReports') as HTMLSelectElement;
  const searchLocationBtn = document.getElementById('searchLocationMapBtn');
  const locationSearchInput = document.getElementById('locationSearchMap') as HTMLInputElement;
  const findNearMeBtn = document.getElementById('findNearMe');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      const filters: ReportFilters = {};
      
      if (wasteTypeFilter && wasteTypeFilter.value) {
        filters.wasteType = wasteTypeFilter.value;
      }
      
      if (dateRangeFilter && dateRangeFilter.value) {
        filters.dateRange = dateRangeFilter.value as any;
      }
      
      if (statusFilter && statusFilter.value) {
        filters.status = statusFilter.value;
      }
      
      void applyFilters(filters);
    });
  }

  if (sortSelector) {
    sortSelector.addEventListener('change', () => {
      sortReports(sortSelector.value);
    });
  }

  if (searchLocationBtn && locationSearchInput) {
    searchLocationBtn.addEventListener('click', () => {
      searchLocationOnMap(locationSearchInput.value);
    });
  }

  if (findNearMeBtn) {
    findNearMeBtn.addEventListener('click', () => {
      findReportsNearUser();
    });
  }
}

/**
 * Apply filters to the reports list and map
 */
async function applyFilters(filters: ReportFilters): Promise<void> {
  try {
    // Show loading state
    const reportsListElement = document.getElementById('reportsList');
    if (reportsListElement) {
      reportsListElement.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Loading reports...</p>
        </div>
      `;
    }

    // Fetch filtered reports
    const reports = await fetchReports(filters);
    currentReports = reports;
    
    // Update UI
    renderReportsList(reports);
    updateMapMarkers(reports);
    
    // Update the count display
    const totalFiltered = reports.length;
    showNotification(`Showing ${totalFiltered} report${totalFiltered !== 1 ? 's' : ''}.`, 'info', 3000);
    
  } catch (error) {
    console.error('Error applying filters:', error);
    showNotification('Failed to apply filters. Please try again.', 'error');
  }
}

/**
 * Sort reports in the list view
 */
function sortReports(sortBy: string): void {
  const reportsListElement = document.getElementById('reportsList');
  if (!reportsListElement) return;

  const reportCards = Array.from(reportsListElement.querySelectorAll('.report-card'));
  
  reportCards.sort((a, b) => {
    const aId = a.getAttribute('data-id');
    const bId = b.getAttribute('data-id');
    
    if (!aId || !bId) return 0;
    
    const aReport = currentReports.find(r => r.id === aId);
    const bReport = currentReports.find(r => r.id === bId);
    
    if (!aReport || !bReport) return 0;
    
    switch (sortBy) {
      case 'recent':
        return new Date(bReport.created_at).getTime() - new Date(aReport.created_at).getTime();
      case 'oldest':
        return new Date(aReport.created_at).getTime() - new Date(bReport.created_at).getTime();
      case 'nearest':
        // This would require user's current location
        // For simplicity, we'll use a placeholder implementation
        return 0;
      default:
        return 0;
    }
  });
  
  // Clear the list and append sorted cards
  reportsListElement.innerHTML = '';
  reportCards.forEach(card => reportsListElement.appendChild(card));
}

/**
 * Filter reports by location (client-side)
 */
function filterByLocation(reports: WasteReport[], location: { lat: number; lng: number; radius: number }): WasteReport[] {
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

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
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

/**
 * Search for a location on the map
 */
function searchLocationOnMap(query: string): void {
  if (!query.trim()) return;
  
  // This function would interact with the map component
  // Implementation depends on the specific map API being used
  console.log('Searching for location:', query);
}

/**
 * Find reports near the user's current location
 */
function findReportsNearUser(): void {
  if (!navigator.geolocation) {
    showNotification('Geolocation is not supported by your browser.', 'error');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        radius: 10 // 10km radius
      };
      
      // Apply location filter
      const filters: ReportFilters = {
        location: userLocation
      };
      
      await applyFilters(filters);
      
      // Center map on user location
      // Implementation depends on the map component
      console.log('Centering map on user location:', userLocation);
    },
    () => {
      showNotification('Unable to get your location. Please enable location access.', 'error');
    }
  );
}

/**
 * Highlight a specific report on the map
 */
function highlightReportOnMap(reportId: string): void {
  // This function would interact with the map component
  // Implementation depends on the specific map API being used
  console.log('Highlighting report on map:', reportId);
}

/**
 * Update map markers based on filtered reports
 */
function updateMapMarkers(reports: WasteReport[]): void {
  // This function would interact with the map component
  // Implementation depends on the specific map API being used
  console.log('Updating map markers with', reports.length, 'reports');
}

// Helper functions
function getWasteTypeDisplay(wasteType: string): string {
  const typeMap: Record<string, string> = {
    'plastic': 'Plastic Waste',
    'metal': 'Metal Waste',
    'glass': 'Glass Waste',
    'paper': 'Paper Waste',
    'electronic': 'Electronic Waste',
    'organic': 'Organic Waste',
    'hazardous': 'Hazardous Waste',
    'construction': 'Construction Waste',
    'mixed': 'Mixed Waste',
    'other': 'Other Waste'
  };
  
  return typeMap[wasteType] || 'Unknown Waste Type';
}

function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'completed': 'Cleaned Up'
  };
  
  return statusMap[status] || 'Unknown Status';
}

function formatLocation(lat: number, lng: number): string {
  // In a real app, we would use reverse geocoding to get a human-readable address
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Initialize the waste reports dashboard
 */
export async function initReportsMap(): Promise<void> {
  try {
    // Initialize filters
    initReportFilters();
    
    // Load initial reports
    const reports = await fetchReports();
    currentReports = reports;
    
    // Render reports list
    renderReportsList(reports);
    
    // Update statistics
    const stats = await getReportStats();
    updateReportStatsUI(stats);
    
  } catch (error) {
    console.error('Error initializing reports map:', error);
    showNotification('Failed to load waste report data. Please refresh the page.', 'error');
  }
} 