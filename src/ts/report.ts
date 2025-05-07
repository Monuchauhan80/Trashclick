import { supabase } from './supabase';
import { showNotification } from './utils';
import { getCurrentUser } from './auth';

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

export class WasteReportMap {
  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private locationInput: HTMLInputElement;
  private mapContainer: HTMLElement;

  constructor(mapContainerId: string, locationInputId: string) {
    this.mapContainer = document.getElementById(mapContainerId) || document.createElement('div');
    this.locationInput = document.getElementById(locationInputId) as HTMLInputElement || document.createElement('input');
    this.initMap();
    this.setupEventListeners();
  }

  private async initMap(): Promise<void> {
    try {
      // Get user's current location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.createMap(userLocation);
          },
          () => {
            // Default location if user denies location access
            this.createMap({ lat: 40.7128, lng: -74.0060 }); // New York as default
          }
        );
      } else {
        // Fallback for browsers without geolocation
        this.createMap({ lat: 40.7128, lng: -74.0060 });
        showNotification('Geolocation is not supported by your browser.', 'error');
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      showNotification('Failed to initialize map. Please try again later.', 'error');
    }
  }

  private createMap(center: google.maps.LatLngLiteral): void {
    const mapOptions: google.maps.MapOptions = {
      center,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    };

    this.map = new google.maps.Map(this.mapContainer, mapOptions);
    this.addMarker(center);
    this.updateLocationInput(center);
  }

  private addMarker(position: google.maps.LatLngLiteral): void {
    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new google.maps.Marker({
      position,
      map: this.map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      title: 'Waste location'
    });

    // Update location when marker is dragged
    this.marker.addListener('dragend', () => {
      if (this.marker && this.marker.getPosition()) {
        const pos = this.marker.getPosition();
        if (pos) {
          const newPos = { lat: pos.lat(), lng: pos.lng() };
          this.updateLocationInput(newPos);
        }
      }
    });
  }

  private updateLocationInput(position: google.maps.LatLngLiteral): void {
    this.locationInput.value = `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
  }

  private setupEventListeners(): void {
    // Add click listener to map
    if (this.map) {
      this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const clickedPos = { 
            lat: event.latLng.lat(), 
            lng: event.latLng.lng() 
          };
          this.addMarker(clickedPos);
          this.updateLocationInput(clickedPos);
        }
      });
    }

    // Search location functionality
    const searchInput = document.getElementById('locationSearch') as HTMLInputElement;
    if (searchInput) {
      const searchBtn = document.getElementById('searchLocationBtn');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => this.searchLocation(searchInput.value));
      }
      
      // Search on Enter key
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchLocation(searchInput.value);
        }
      });
    }
  }

  private searchLocation(query: string): void {
    if (!query.trim()) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const position = results[0].geometry.location;
        const newPos = { lat: position.lat(), lng: position.lng() };
        
        if (this.map) {
          this.map.setCenter(newPos);
          this.addMarker(newPos);
          this.updateLocationInput(newPos);
        }
      } else {
        showNotification('Location not found. Please try a different search term.', 'warning');
      }
    });
  }

  public getCurrentLocation(): { lat: number, lng: number } | null {
    if (this.marker && this.marker.getPosition()) {
      const pos = this.marker.getPosition();
      if (pos) {
        return { lat: pos.lat(), lng: pos.lng() };
      }
    }
    return null;
  }
}

export async function initReportForm(): Promise<void> {
  const reportForm = document.getElementById('wasteReportForm') as HTMLFormElement;
  if (!reportForm) return;

  // Initialize map
  const map = new WasteReportMap('mapContainer', 'locationCoordinates');
  
  // Preview uploaded image
  const imageInput = document.getElementById('wasteImage') as HTMLInputElement;
  const imagePreview = document.getElementById('imagePreview') as HTMLImageElement;
  
  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', () => {
      if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
          }
        };
        reader.readAsDataURL(imageInput.files[0]);
      }
    });
  }

  // Handle form submission
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        showNotification('Please log in to report waste.', 'error');
        return;
      }

      const wasteTypeSelect = document.getElementById('wasteType') as HTMLSelectElement;
      const descriptionInput = document.getElementById('wasteDescription') as HTMLTextAreaElement;
      
      const location = map.getCurrentLocation();
      if (!location) {
        showNotification('Please select a location on the map.', 'error');
        return;
      }

      const reportData: ReportData = {
        location,
        wasteType: wasteTypeSelect.value,
        description: descriptionInput.value,
        userId: currentUser.id
      };

      // Handle image upload if present
      if (imageInput && imageInput.files && imageInput.files[0]) {
        reportData.imageFile = imageInput.files[0];
      }

      await submitReport(reportData);
      showNotification('Waste report submitted successfully. Thank you for helping clean up!', 'success');
      reportForm.reset();
      imagePreview.style.display = 'none';
      
    } catch (error) {
      console.error('Error submitting report:', error);
      showNotification('Failed to submit waste report. Please try again.', 'error');
    }
  });
}

async function submitReport(data: ReportData): Promise<void> {
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
  } catch (error) {
    console.error('Error in submitReport:', error);
    throw new Error('Failed to submit waste report');
  }
}

export function loadReportsOnMap(mapContainer: string): void {
  const map = new WasteReportMap(mapContainer, 'hidden-input');
  
  loadReports().then(reports => {
    reports.forEach(report => {
      addReportMarker(map, report);
    });
  }).catch(error => {
    console.error('Error loading reports:', error);
    showNotification('Failed to load waste reports.', 'error');
  });
}

async function loadReports() {
  try {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw new Error('Failed to load reports');
  }
}

function addReportMarker(map: WasteReportMap, report: any): void {
  // This would need to be implemented based on the specific map implementation
  // For example, adding a custom marker to the map with report info
  console.log('Adding marker for report:', report);
  // Implementation depends on the mapping library used
} 