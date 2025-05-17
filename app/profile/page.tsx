"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, ExternalLink, Mail, Globe, Calendar, PenSquare } from "lucide-react"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const { user, isLoading: authLoading } = useSupabase()
  const router = useRouter()

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
        
        // Check if profiles table exists and has user data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error loading profile:', error)
          
          // If the error is because the profile doesn't exist, create it
          if (error.code === 'PGRST116' || error.code === 'PGRST104') {
            // This error means the table doesn't exist or record not found
            await createUserProfile(user.id, user.email || '')
            setProfileData({
              id: user.id,
              email: user.email,
              created_at: user.created_at || new Date().toISOString()
            })
          } else {
            // For other errors, show a message but continue rendering the page
            setError('Could not load complete profile data')
            setProfileData({
              id: user.id,
              email: user.email,
              created_at: user.created_at || new Date().toISOString()
            })
          }
        } else {
          setProfileData(data)
        }
      } catch (err) {
        console.error('Error:', err)
        // Still render basic profile with user data even if there's an error
        setProfileData({
          id: user.id,
          email: user.email,
          created_at: user.created_at || new Date().toISOString()
        })
        setError('An unexpected error occurred loading profile details')
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
      }
    }
    
    if (user) loadProfile()
  }, [user, authLoading, router])

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Link href="/profile/edit">
          <Button>
            <PenSquare className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-xl font-medium">{profileData?.full_name || user.email}</h2>
              {profileData?.username && (
                <p className="text-sm text-muted-foreground">@{profileData.username}</p>
              )}
              {error && (
                <p className="text-xs text-amber-600 mt-2 text-center">{error}</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 border-b pb-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 border-b pb-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p>{new Date(user.created_at || user.updated_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              
              {profileData?.website && (
                <div className="flex items-start gap-3 border-b pb-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Website</p>
                    <a 
                      href={profileData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {profileData.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reports Submitted</p>
                  <p>0</p>
                  <Button variant="link" className="px-0 h-auto py-1" onClick={() => router.push('/reports')}>
                    View my reports
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-start">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
} 