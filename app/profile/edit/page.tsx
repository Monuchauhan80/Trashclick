"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, AlertCircle, User } from "lucide-react"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"

export default function EditProfilePage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: authLoading } = useSupabase()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    website: "",
  })

  useEffect(() => {
    setMounted(true)
    
    // Redirect if not logged in
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    // Load user profile data
    const loadProfile = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Try to load existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error loading profile:', error)
          
          // Handle case where table doesn't exist or record not found
          if (error.code === 'PGRST116' || error.code === 'PGRST104') {
            // Create a new profile
            await createUserProfile(user.id, user.email || '')
            // Continue with empty form data
            return
          }
          
          throw error
        }
        
        if (data) {
          setFormData({
            username: data.username || "",
            full_name: data.full_name || "",
            website: data.website || "",
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profile')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Create user profile if it doesn't exist
    const createUserProfile = async (userId: string, email: string) => {
      try {
        await supabase
          .from('profiles')
          .insert([
            { 
              id: userId,
              email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
      } catch (err) {
        console.error('Error creating profile:', err)
        setError('Could not create profile. Database setup may be required.')
      }
    }
    
    if (user) loadProfile()
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    if (!user) {
      setError("You must be logged in to update your profile")
      setIsSaving(false)
      return
    }

    try {
      // Check if profile exists first
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST104') {
        throw new Error(`Error checking profile: ${checkError.message}`)
      }
      
      // If no profile exists, create it
      if (!existingProfile) {
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: user.id,
              email: user.email,
              username: formData.username,
              full_name: formData.full_name,
              website: formData.website,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ])
        
        if (createError) {
          throw new Error(`Error creating profile: ${createError.message}`)
        }
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            full_name: formData.full_name,
            website: formData.website,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
        
        if (updateError) {
          throw new Error(`Error updating profile: ${updateError.message}`)
        }
      }

      // Success
      setIsSuccess(true)
      
      // Reset success message after delay
      setTimeout(() => {
        setIsSuccess(false)
        // Redirect to dashboard
        router.push('/profile')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Profile update error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Show a loading state until hydration is complete
  if (!mounted || authLoading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
  
  // Ensure user is authenticated
  if (!user) {
    return null // Router will handle redirect
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
      
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-xl font-medium">{user.email}</h2>
            <p className="text-sm text-muted-foreground">Member since {new Date(user.created_at || user.updated_at || Date.now()).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                <p className="flex items-center font-medium">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Error
                </p>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            )}
            
            {isSuccess && (
              <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
                <p className="flex items-center font-medium">
                  <Check className="mr-2 h-5 w-5" />
                  Profile Updated
                </p>
                <p className="mt-2 text-sm">
                  Your profile information has been updated successfully.
                </p>
              </div>
            )}
            
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="johnsmith"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Smith"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/profile')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || isSuccess}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 