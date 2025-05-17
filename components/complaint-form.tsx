"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, Upload, Loader2, Check, AlertCircle } from "lucide-react"
import { useSupabase } from "@/contexts/supabase-context"
import { submitComplaint, uploadImage } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

export default function ComplaintForm() {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { user } = useSupabase()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    image: null as File | null,
  })

  // Ensure hydration completes before rendering complex UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, image: file })

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      let imageUrl = null

      // Upload image if present
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${user ? user.id : 'anonymous'}/${fileName}`

        const { data: uploadData, error: uploadError } = await uploadImage(filePath, formData.image)

        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`)
        }

        // Get the public URL
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/complaint-images/${filePath}`
      }

      // Submit complaint data to Supabase
      const { data, error: submissionError } = await submitComplaint({
        description: formData.description,
        location: formData.location,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        image_url: imageUrl || undefined,
        user_id: user?.id || undefined,
      })

      if (submissionError) {
        throw new Error(`Error submitting complaint: ${submissionError.message}`)
      }

      // Success
      setIsSuccess(true)
      
      // Reset form after showing success message
      setTimeout(() => {
        setIsSuccess(false)
        setFormData({
          description: "",
          location: "",
          latitude: "",
          longitude: "",
          image: null,
        })
        setImagePreview(null)
        
        // Redirect if the user is authenticated
        if (user) {
          router.push('/dashboard')
        }
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show a simplified version until hydration is complete
  if (!mounted) {
    return <div className="rounded-lg border p-8">Loading form...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the environmental issue you've found..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-32"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <Input
            id="location"
            placeholder="Enter the location of the issue"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
            className="pl-10"
          />
          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            placeholder="e.g. 40.7128"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            placeholder="e.g. -74.0060"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Upload Image</Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="relative mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-6 py-10 hover:border-primary/50">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span>
                  <span className="pl-1">or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
          {imagePreview && (
            <div className="relative h-40 w-full overflow-hidden rounded-lg border">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imagePreview})` }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={() => {
                  setImagePreview(null)
                  setFormData({ ...formData, image: null })
                }}
              >
                <span className="sr-only">Remove image</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="flex items-center font-medium">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error
          </p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : isSuccess ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Report Submitted!
          </>
        ) : (
          "Submit Report"
        )}
      </Button>

      {isSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-green-700">
          <p className="flex items-center font-medium">
            <Check className="mr-2 h-5 w-5" />
            Your report has been submitted successfully!
          </p>
          <p className="mt-2 text-sm">
            Thank you for helping keep our environment clean. 
            {user ? " You can track the status of your report in your dashboard." : " Create an account to track your reports."}
          </p>
        </div>
      )}
    </form>
  )
}

