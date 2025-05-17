"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ListTodo, AlertTriangle } from "lucide-react"
import { format } from "date-fns"

interface Report {
  id: string
  description: string
  location: string
  status: string
  created_at: string
  // Add other fields you might want to display
}

export default function DepartmentDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignedMunicipalityId, setAssignedMunicipalityId] = useState<string | null>(null)
  const [assignedMunicipalityName, setAssignedMunicipalityName] = useState<string>("")
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        // If user data is loaded but no user, redirect
        if (!authLoading) {
            router.push('/login?redirect=/department/dashboard')
        }
        return // Wait for user data if auth is loading
      }

      setIsLoading(true)
      setError(null)

      try {
        // 1. Get the user's profile and assigned municipality
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('municipality_id')
          .eq('id', user.id)
          .single()

        if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`)
        
        if (!profileData?.municipality_id) {
          setError("Access Denied: You are not assigned to a specific department.")
          setIsLoading(false)
          return
        }
        
        setAssignedMunicipalityId(profileData.municipality_id)

        // Optional: Fetch municipality name for display
        const { data: muniData, error: muniError } = await supabase
            .from('municipalities')
            .select('name')
            .eq('id', profileData.municipality_id)
            .single();
        if (!muniError && muniData) {
            setAssignedMunicipalityName(muniData.name);
        } else {
            setAssignedMunicipalityName(profileData.municipality_id); // Fallback to ID if name fetch fails
        }


        // 2. Fetch reports assigned to this municipality
        const { data: reportData, error: reportError } = await supabase
          .from('complaints')
          .select('id, description, location, status, created_at') // Select specific columns needed
          .eq('municipality', profileData.municipality_id)
          .order('created_at', { ascending: false })

        if (reportError) throw new Error(`Failed to fetch reports: ${reportError.message}`)

        setReports(reportData || [])

      } catch (err: any) {
        console.error("Error in Department Dashboard:", err)
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch data once auth is resolved
    if (!authLoading) {
        fetchData()
    }

  }, [user, authLoading, router])

  // Handling States: Loading, Error, No Assignment, Success
  if (authLoading || (isLoading && !error)) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Card className="w-full max-w-md bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle /> Error
            </CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} variant="secondary" className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!assignedMunicipalityId) {
      // This case should ideally be caught by the error state now, but keep as fallback
      return (
        <div className="container py-20 flex justify-center items-center">
            <p>You are not assigned to a department.</p>
        </div>
      )
  }

  // --- Main Dashboard Content ---
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Department Dashboard</h1>
        <p className="text-muted-foreground">
            Managing reports for: <span className="font-semibold">{assignedMunicipalityName || assignedMunicipalityId}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo /> Assigned Reports
          </CardTitle>
          <CardDescription>
            View and manage reports assigned to your department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No reports currently assigned to your department.
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none truncate">{report.description}</p>
                    <p className="text-sm text-muted-foreground">{report.location || "No location provided"}</p>
                    <p className="text-xs text-muted-foreground">
                      Reported: {format(new Date(report.created_at), 'MMM d, yyyy - h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        report.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-300' :
                        report.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                       {report.status.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                     </span>
                    {/* Placeholder for Update Status Button */}
                    <Button variant="outline" size="sm">
                       Update Status
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 