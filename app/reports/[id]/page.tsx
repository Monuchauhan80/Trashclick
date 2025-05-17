"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { formatDistance } from "date-fns"
import { ChevronLeft, Edit, MapPin, Calendar, Clock, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { StatusUpdateModal } from "@/components/StatusUpdateModal"
import { ImageWithFallback } from "@/components/ImageWithFallback"
import { supabase } from "@/lib/supabase"
import { useSupabase } from "@/contexts/supabase-context"
import React from "react"

interface Report {
  id: string
  user_id: string
  description: string
  location: string
  status: string
  created_at: string
  updated_at?: string
  image_url?: string
  notes?: string
}

export default function ReportDetail() {
  const params = useParams()
  const reportId = params.id as string
  
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { user } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true)

        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session) {
          toast({
            title: "Authentication required",
            description: "Please log in to view report details",
            variant: "destructive",
          })
          router.push('/login')
          return
        }

        // Fetch report details
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('id', reportId)
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          toast({
            title: "Report not found",
            description: "The requested report does not exist",
            variant: "destructive",
          })
          router.push('/reports')
          return
        }

        setReport(data as Report)
      } catch (error: any) {
        console.error("Error fetching report:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to fetch report details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId, router, toast])

  useEffect(() => {
    // Check if the current user has admin privileges
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        // Check if the user is in the admins table or has admin role in profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        // Set admin status based on the query result
        setIsAdmin(data?.role === 'admin' || data?.is_admin === true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "resolved":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
  }

  const getTimeSince = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="gap-1" disabled>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1"
            onClick={() => router.push('/reports')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-8">Report not found or you don't have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1"
          onClick={() => router.push('/reports')}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Reports
        </Button>
        
        {user && (
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => setIsStatusModalOpen(true)}
          >
            {isAdmin ? (
              <>
                <ShieldAlert className="h-4 w-4" />
                Update Status (Admin)
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                View Status Details
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Report #{report.id.slice(0, 8)}</h1>
        <div className="flex flex-wrap gap-3 items-center text-sm text-muted-foreground">
          <Badge className={getStatusColor(report.status)}>
            {formatStatus(report.status)}
          </Badge>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(report.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{getTimeSince(report.created_at)}</span>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-lg mb-2">Location</h2>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p>{report.location}</p>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">Description</h2>
              <p className="whitespace-pre-line">{report.description}</p>
            </div>

            {report.image_url && (
              <div>
                <h2 className="font-semibold text-lg mb-2">Photo</h2>
                <div className="relative h-64 w-full rounded-md overflow-hidden">
                  <ImageWithFallback
                    src={report.image_url}
                    alt="Report image"
                    fill
                    className="object-contain bg-muted"
                    unoptimized
                  />
                </div>
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <strong>Debug:</strong> Image URL: {report.image_url}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {report.notes && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-lg mb-2">Additional Notes</h2>
            <p className="whitespace-pre-line">{report.notes}</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <StatusUpdateModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          reportId={report.id}
          currentStatus={report.status}
        />
      )}
    </div>
  )
} 