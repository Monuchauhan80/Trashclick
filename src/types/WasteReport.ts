export interface WasteReport {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  title: string;
  description: string;
  imageUrl?: string;
  status: 'reported' | 'in_progress' | 'cleaned';
  userId: string;
  reportedAt: string;
  wasteType: string;
} 