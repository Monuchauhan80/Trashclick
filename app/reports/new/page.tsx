"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { LoaderIcon, ImageIcon, MapPinIcon, XIcon } from "lucide-react"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import MapPicker from "@/components/MapPicker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Geoapify API key
const GEOAPIFY_API_KEY = "b1ddfc53f04943a4ad3ccf419d663432"

export default function NewReportPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [errors, setErrors] = useState<{description?: string, location?: string, category?: string}>({})
  const [showMap, setShowMap] = useState(true)
  const [municipalities, setMunicipalities] = useState<{id: string, name: string}[]>([])
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string>("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, isLoading: authLoading } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  // Get user location on component mount
  useEffect(() => {
    getUserLocation()
  }, [])

  // Fetch municipalities/categories on mount
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const { data, error } = await supabase
          .from('municipalities')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        // Use fetched data or defaults
        const fetchedMunicipalities = data && data.length > 0 ? data : [
          { id: "city-hall", name: "City Hall" },
          { id: "waste-management", name: "Waste Management Department" },
          { id: "parks-recreation", name: "Parks & Recreation" },
          { id: "public-works", name: "Public Works" },
          { id: "environmental-services", name: "Environmental Services" }
        ];
        setMunicipalities(fetchedMunicipalities);

      } catch (error) {
        console.error("Error fetching municipalities:", error);
        // Fall back to default list on error
        setMunicipalities([
          { id: "city-hall", name: "City Hall" },
          { id: "waste-management", name: "Waste Management Department" },
          { id: "parks-recreation", name: "Parks & Recreation" },
          { id: "public-works", name: "Public Works" },
          { id: "environmental-services", name: "Environmental Services" }
        ]);
        toast({
          title: "Could not load categories",
          description: "Using default list.",
          variant: "destructive"
        })
      }
    };
    
    fetchMunicipalities();
    getUserLocation(); // Keep existing location fetching
  }, [])

  // Validate form
  const validateForm = () => {
    const newErrors: {description?: string, location?: string, category?: string} = {}
    let isValid = true

    if (!description.trim()) {
      newErrors.description = "Description is required"
      isValid = false
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
      isValid = false
    }

    if (!location.trim()) {
      newErrors.location = "Location is required"
      isValid = false
    }
    
    if (!selectedMunicipalityId) {
      newErrors.category = "Please select a report category"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image file size must be less than 5MB",
        variant: "destructive"
      })
      return
    }

    setImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Clear selected image
  const clearImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setUserLocation(newLocation)
        
        // Get address for the coordinates
        fetchAddressFromCoordinates(newLocation.latitude, newLocation.longitude)
        
        toast({
          title: "Success",
          description: "Location retrieved successfully"
        })
        setIsGettingLocation(false)
      },
      (error: GeolocationPositionError) => {
        console.error("Error getting location:", error);
        console.error(`Geolocation Error Code: ${error.code}, Message: ${error.message}`);
        
        let errorMessage = "Failed to get your location. Please ensure permissions are granted and location services are enabled.";
        if (error.code === 1) {
            errorMessage = "Permission denied. Please grant location access in your browser settings.";
        } else if (error.code === 2) {
            errorMessage = "Location unavailable. Could not determine position.";
        } else if (error.code === 3) {
            errorMessage = "Timeout. Getting location took too long.";
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        })
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
  
  // Fetch address from coordinates
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const formattedAddress = feature.properties.formatted || "Unknown location"
        setLocation(formattedAddress)
      }
    } catch (error) {
      console.error("Error fetching address:", error)
    }
  }

  // Handle location selected from map
  const handleLocationSelected = (locationData: { latitude: number; longitude: number; address: string }) => {
    setUserLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    })
    setLocation(locationData.address)
  }

  // Submit report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a report",
        variant: "destructive"
      })
      router.push('/login?redirect=/reports/new')
      return
    }

    try {
      setIsLoading(true)
      
      // Upload image if selected
      let imageUrl = null
      if (image) {
        try {
          const fileExt = image.name.split('.').pop()
          const fileName = `${uuidv4()}.${fileExt}`
          const filePath = `reports/${fileName}`
          
          // First make sure we have proper access to storage
          const { data: storageData, error: storageError } = await supabase.storage.listBuckets()
          if (storageError) {
            console.error("Storage API access error:", storageError)
            throw new Error("Unable to access storage API. Check your Supabase configuration.")
          }
          
          // Check if bucket exists, create it if needed
          const { data: bucketExists, error: bucketCheckError } = await supabase.storage
            .getBucket('report-images')
            
          // Create bucket if it doesn't exist
          if (bucketCheckError && bucketCheckError.message.includes('not found')) {
            const { error: createError } = await supabase.storage.createBucket('report-images', {
              public: true,
              fileSizeLimit: 5 * 1024 * 1024
            })
            
            if (createError) {
              console.error("Error creating bucket:", createError)
              throw new Error("Failed to create storage bucket: " + createError.message)
            }
          }
          
          // Upload the file with proper options
          const { error: uploadError } = await supabase.storage
            .from('report-images')
            .upload(filePath, image, {
              cacheControl: '3600',
              upsert: false,
              contentType: image.type // Specify content type
            })
            
          if (uploadError) {
            console.error("Upload error details:", uploadError)
            throw uploadError
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('report-images')
            .getPublicUrl(filePath)
            
          imageUrl = urlData.publicUrl
          console.log("Image uploaded successfully to:", imageUrl)
        } catch (imageError: any) {
          console.error("Error uploading image:", imageError)
          toast({
            title: "Image Upload Failed",
            description: imageError.message || "Could not upload image, but we'll still submit your report",
            variant: "destructive"
          })
        }
      }
      
      // Create report - including municipality and setting status
      try {
        const { error } = await supabase
          .from('complaints')
          .insert({
            user_id: user.id,
            description,
            location,
            status: 'pending',
            municipality: selectedMunicipalityId,
            image_url: imageUrl,
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude
          })
          
        if (error) {
          // Check if it's because the table doesn't exist
          if (error.code === 'PGRST116') {
            // Table doesn't exist - this error would normally be handled by backend setup
            // Show detailed message so the user knows what's happening
            toast({
              title: "Database Setup Required",
              description: "The database tables need to be set up. Please contact the administrator.",
              variant: "destructive"
            })
            return
          }
          throw error
        }
        
        toast({
          title: "Success",
          description: "Your report has been submitted successfully and routed."
        })
        
        router.push('/reports')
      } catch (insertError: any) {
        console.error("Error creating complaint:", insertError)
        toast({
          title: "Error",
          description: insertError.message || "Failed to submit report details",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if not logged in
  if (authLoading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <LoaderIcon className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user && !authLoading) {
    router.push('/login')
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <div className="w-full mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Submit New Report</h1>
          <p className="text-muted-foreground">
            Please provide detailed information about the issue you're reporting
          </p>
        </div>
        
        <Card className="w-full">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Fill out the form below to submit your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Enter location (e.g., street address, landmark)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`flex-1 ${errors.location ? "border-red-500" : ""}`}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={getUserLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPinIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.location && (
                  <p className="text-red-500 text-sm">{errors.location}</p>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>
                  {userLocation && (
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                
                {showMap && (
                  <div className="mt-4">
                    <MapPicker
                      apiKey={GEOAPIFY_API_KEY}
                      initialLocation={userLocation || undefined}
                      onLocationSelected={handleLocationSelected}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category / Department <span className="text-red-500">*</span></Label>
                <Select 
                  value={selectedMunicipalityId} 
                  onValueChange={setSelectedMunicipalityId}
                >
                  <SelectTrigger id="category" className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select the most relevant category/department" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.length === 0 && (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    )}
                    {municipalities.map((municipality) => (
                      <SelectItem key={municipality.id} value={municipality.id}>
                        {municipality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Image (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {image ? "Change Image" : "Upload Image"}
                  </Button>
                  {image && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearImage}
                      size="sm"
                      className="h-9 px-2.5"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
                
                {imagePreview && (
                  <div className="mt-4 relative">
                    <div className="aspect-video w-full rounded-md overflow-hidden border bg-muted">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/reports')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 