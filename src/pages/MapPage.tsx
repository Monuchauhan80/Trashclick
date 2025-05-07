import React, { useState, useEffect } from 'react';
import Map from '../components/Map';
import './MapPage.css';

interface WasteReport {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  waste_type: string;
  status: string;
  reported_at: string;
}

const MapPage: React.FC = () => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      const mockReports: WasteReport[] = [
        {
          id: '1',
          title: 'Illegal Dumping',
          description: 'Large pile of construction debris',
          location: { lat: 40.730610, lng: -73.935242 },
          waste_type: 'Construction',
          status: 'reported',
          reported_at: '2023-06-15T10:30:00Z'
        },
        {
          id: '2',
          title: 'Overflowing Trash',
          description: 'Trash bins overflowing for days',
          location: { lat: 40.735610, lng: -73.945242 },
          waste_type: 'Household',
          status: 'in_progress',
          reported_at: '2023-06-14T09:15:00Z'
        },
        {
          id: '3',
          title: 'Abandoned Furniture',
          description: 'Several pieces of furniture left on sidewalk',
          location: { lat: 40.725610, lng: -73.925242 },
          waste_type: 'Furniture',
          status: 'resolved',
          reported_at: '2023-06-13T14:45:00Z'
        }
      ];
      
      setReports(mockReports);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Convert reports to map markers
  const mapMarkers = reports.map(report => ({
    position: report.location,
    title: report.title
  }));

  const handleMapClick = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="map-page">
      <h1>Waste Reports Map</h1>
      
      <div className="map-filters">
        <select className="filter-select">
          <option value="all">All Waste Types</option>
          <option value="Household">Household</option>
          <option value="Construction">Construction</option>
          <option value="Furniture">Furniture</option>
          <option value="Electronic">Electronic</option>
        </select>
        
        <select className="filter-select">
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      
      <div className="map-wrapper">
        {isLoading ? (
          <div className="loading">Loading map data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <Map 
            markers={mapMarkers}
            onMapClick={handleMapClick}
          />
        )}
      </div>
      
      {selectedLocation && (
        <div className="selected-location">
          <h3>Selected Location</h3>
          <p>Latitude: {selectedLocation.lat.toFixed(6)}</p>
          <p>Longitude: {selectedLocation.lng.toFixed(6)}</p>
          <button className="report-button">Report Waste at This Location</button>
        </div>
      )}
      
      <div className="reports-list">
        <h2>Recent Reports ({reports.length})</h2>
        {reports.map(report => (
          <div key={report.id} className={`report-card status-${report.status}`}>
            <h3>{report.title}</h3>
            <p>{report.description}</p>
            <div className="report-meta">
              <span className="waste-type">{report.waste_type}</span>
              <span className="status">{report.status.replace('_', ' ')}</span>
              <span className="date">{new Date(report.reported_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapPage; 