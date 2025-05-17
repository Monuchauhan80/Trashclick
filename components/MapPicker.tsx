"use client"

import { useEffect, useRef, useState } from "react"
import { MapPinIcon, Search, Filter, Navigation } from "lucide-react"

// Define types for MapLibre GL
declare global {
  interface Window {
    maplibregl: {
      Map: new (options: any) => any;
      NavigationControl: new () => any;
      Marker: new (options: any) => any;
    };
  }
}

interface MapPickerProps {
  onLocationSelected: (location: { latitude: number; longitude: number; address: string }) => void
  initialLocation?: { latitude: number; longitude: number }
  height?: string
  placeholder?: string
}

const PLACE_TYPES = [
  { value: "", label: "All Places" },
  { value: "amenity", label: "Amenities" },
  { value: "restaurant", label: "Restaurants" },
  { value: "hotel", label: "Hotels" },
  { value: "shop", label: "Shops" },
  { value: "tourism", label: "Tourist Attractions" }
]

export function MapPicker({ 
  onLocationSelected, 
  initialLocation,
  height = "400px",
  placeholder = "Search for a location..."
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlaceType, setSelectedPlaceType] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  const API_KEY = "8342a8158d7048f78527003465bdffb0"

  // Load MapLibre GL scripts
  useEffect(() => {
    const loadMapLibre = async () => {
      if (!window.maplibregl) {
        try {
          // Load MapLibre GL JS
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.js'
          script.async = true
          
          // Load MapLibre GL CSS
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/maplibre-gl@3.0.0/dist/maplibre-gl.css'
          
          // Wait for script to load
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load MapLibre GL'))
            document.head.appendChild(script)
            document.head.appendChild(link)
          })
        } catch (err) {
          console.error('Error loading MapLibre GL:', err)
          setError('Failed to load map resources')
          return
        }
      }
      
      initializeMap()
    }

    loadMapLibre()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [])

  const initializeMap = () => {
    if (!mapContainer.current || !window.maplibregl) return

    try {
      mapRef.current = new window.maplibregl.Map({
        container: mapContainer.current,
        style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${API_KEY}`,
        center: initialLocation ? [initialLocation.longitude, initialLocation.latitude] : [76.5, 30.5], // Default to PB, India
        zoom: initialLocation ? 12 : 8
      })

      mapRef.current.addControl(new window.maplibregl.NavigationControl())

      // Add marker
      markerRef.current = new window.maplibregl.Marker({
        color: "#FF0000",
        draggable: true
      })
        .setLngLat(initialLocation ? [initialLocation.longitude, initialLocation.latitude] : [76.5, 30.5])
        .addTo(mapRef.current)

      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current.getLngLat()
        updateLocation(lngLat.lng, lngLat.lat)
      })

      mapRef.current.on('click', (e: any) => {
        const lngLat = e.lngLat
        markerRef.current.setLngLat([lngLat.lng, lngLat.lat])
        updateLocation(lngLat.lng, lngLat.lat)
      })

      mapRef.current.on('load', () => {
        setMapLoaded(true)
        if (initialLocation) {
          fetchAddress(initialLocation.longitude, initialLocation.latitude)
        } else {
          fetchAddress(76.5, 30.5) // Default to PB, India
        }
      })
    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize map')
    }
  }

  const updateLocation = async (lng: number, lat: number) => {
    if (!mapRef.current) return
    
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 12,
      essential: true
    })
    await fetchAddress(lng, lat)
  }

  const fetchAddress = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.features?.length > 0) {
        const feature = data.features[0]
        const addr = feature.properties.formatted || 
          `${feature.properties.postcode}, ${feature.properties.state}, ${feature.properties.country}`
        setAddress(addr)
        setSearchQuery(addr)
        onLocationSelected({
          latitude: lat,
          longitude: lng,
          address: addr
        })
      }
    } catch (err) {
      console.error("Failed to fetch address:", err)
      setError("Failed to fetch address details")
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      let url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&apiKey=${API_KEY}`
      if (selectedPlaceType) url += `&type=${selectedPlaceType}`

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.features?.length > 0) {
        setSearchResults(data.features)
        setShowResults(true)
        
        // Update map to first result
        const first = data.features[0]
        if (first.geometry.type === "Point") {
          const [lng, lat] = first.geometry.coordinates
          updateLocation(lng, lat)
        }
      } else {
        setError("Location not found")
        setSearchResults([])
        setShowResults(false)
      }
    } catch (err) {
      console.error("Failed to search location:", err)
      setError("Failed to search location")
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (result: any) => {
    if (result.geometry.type === "Point") {
      const [lng, lat] = result.geometry.coordinates
      updateLocation(lng, lat)
    }
    setSearchQuery(result.properties.formatted || result.properties.name || "")
    setShowResults(false)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.longitude, pos.coords.latitude)
        setIsGettingLocation(false)
      },
      (err) => {
        console.error("Geolocation error:", err)
        setError("Failed to get current location")
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex flex-col gap-2 mb-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(false)
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSearching}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search Location"}
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            {isGettingLocation ? "Getting..." : "Current"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedPlaceType}
            onChange={(e) => setSelectedPlaceType(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PLACE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      {showResults && searchResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto border rounded-md shadow-lg">
          {searchResults.map((result, i) => (
            <button
              key={i}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="font-medium">{result.properties.name || "Unnamed Location"}</div>
              <div className="text-sm text-gray-500">{result.properties.formatted}</div>
            </button>
          ))}
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div 
        ref={mapContainer} 
        className="rounded-md overflow-hidden border"
        style={{ height }}
      />

      <div className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded">
        <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
        <span>{address || "No location selected"}</span>
      </div>
    </div>
  )
}