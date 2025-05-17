"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"
import { formatDistance, format } from "date-fns"
import { Loader2, CheckCircle2, AlertCircle, Clock, MapPin, BarChart, Filter, RefreshCw, Shield, CheckSquare, XCircle } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCount, setAdminCount] = useState(0)
  const [reports, setReports] = useState<any[]>([])
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [municipalities, setMunicipalities] = useState<{id: string, name: string}[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isBatchUpdating, setIsBatchUpdating] = useState(false)
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/login?redirect=/admin/dashboard')
        return
      }
      
      try {
        // Check if the user is an admin
        const { data, error } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        
        const adminStatus = data?.role === 'admin' || data?.is_admin === true
        setIsAdmin(adminStatus)
        
        if (!adminStatus) {
          toast({
            title: "Access Denied",
            description: "You must be an administrator to access this page",
            variant: "destructive",
          })
          router.push('/')
          return
        }
        
        // Get total admin count for the system
        const { data: adminData, error: countError } = await supabase
          .from('profiles')
          .select('id')
          .or('role.eq.admin,is_admin.eq.true')
        
        if (!countError && adminData) {
          setAdminCount(adminData.length)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }
    
    checkAdminStatus()
  }, [user, router])
  
  useEffect(() => {
    const fetchReports = async () => {
      if (!isAdmin) return
      
      try {
        setIsLoading(true)
        
        // Filter by status if selected
        let query = supabase
          .from('complaints')
          // Temporarily remove the join to profiles to simplify the query
          // .select('*, profiles(email)') 
          .select('*') // Fetch all columns from complaints only
          .order('created_at', { ascending: false })
          
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }
        
        const { data, error } = await query
        
        if (error) {
          // Log the specific error for debugging
          console.error("Error fetching reports:", error); 
          throw error; // Re-throw the error after logging
        }
        
        setReports(data || [])
      } catch (error) {
        // Catch block already logs the error, ensure it does
        console.error("Caught error in fetchReports:", error) 
        // Optionally show a toast message here as well
        toast({
            title: "Failed to load reports",
            description: `There was an issue retrieving reports. Please check console for details.`,
            variant: "destructive",
          })
      } finally {
        setIsLoading(false)
      }
    }
    
    const setupMunicipalities = async () => {
      try {
        // Check if municipalities table exists and fetch data
        const { data, error } = await supabase
          .from('municipalities')
          .select('id, name')
          .order('name')
          
        // If there's an error or no data, create default municipalities
        const defaultMunicipalities = [
          { id: "city-hall", name: "City Hall" },
          { id: "waste-management", name: "Waste Management Department" },
          { id: "parks-recreation", name: "Parks & Recreation" },
          { id: "public-works", name: "Public Works" },
          { id: "environmental-services", name: "Environmental Services" }
        ]
        
        if (error || !data || data.length === 0) {
          // If table doesn't exist, create it and insert default data
          try {
            // Create municipalities table if it doesn't exist
            for (const muni of defaultMunicipalities) {
              await supabase.from('municipalities').upsert(muni)
            }
          } catch (createError) {
            console.error("Error creating municipalities:", createError)
          }
          
          setMunicipalities(defaultMunicipalities)
        } else {
          // Filter out any municipalities with empty or null IDs or names
          const validMunicipalities = data.filter(muni => muni && muni.id && muni.name);
          setMunicipalities(validMunicipalities.length > 0 ? validMunicipalities : defaultMunicipalities)
        }
      } catch (error) {
        console.error("Error with municipalities:", error)
        // Fall back to default municipalities
        setMunicipalities([
          { id: "city-hall", name: "City Hall" },
          { id: "waste-management", name: "Waste Management Department" },
          { id: "parks-recreation", name: "Parks & Recreation" },
          { id: "public-works", name: "Public Works" },
          { id: "environmental-services", name: "Environmental Services" }
        ])
      }
    }
    
    if (isAdmin) {
      fetchReports()
      setupMunicipalities()
    }
  }, [isAdmin, statusFilter])
  
  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([])
    } else {
      setSelectedReports(reports.map(report => report.id))
    }
  }
  
  const handleSelectReport = (reportId: string) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter(id => id !== reportId))
    } else {
      setSelectedReports([...selectedReports, reportId])
    }
  }
  
  const handleBatchUpdate = async () => {
    if (selectedReports.length === 0) {
      toast({
        title: "No reports selected",
        description: "Please select at least one report to update",
        variant: "destructive",
      })
      return
    }
    
    if (!selectedStatus) {
      toast({
        title: "Status required",
        description: "Please select a status for the batch update",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsBatchUpdating(true)
      
      // Process updates in batches of 10 to prevent overwhelming the database
      const batchSize = 10
      for (let i = 0; i < selectedReports.length; i += batchSize) {
        const batch = selectedReports.slice(i, i + batchSize)
        const updates = batch.map(id => 
          supabase
            .from('complaints')
            .update({
              status: selectedStatus,
              municipality: selectedMunicipality === "unassigned" ? null : selectedMunicipality,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        )
        
        await Promise.all(updates)
      }
      
      toast({
        title: "Batch update complete",
        description: `Successfully updated ${selectedReports.length} reports`,
      })
      
      // Refresh reports list
      const { data } = await supabase
        .from('complaints')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false })
      
      setReports(data || [])
      setSelectedReports([])
      setSelectedStatus("")
      setSelectedMunicipality("")
      
    } catch (error) {
      console.error("Error in batch update:", error)
      toast({
        title: "Batch update failed",
        description: "There was an error updating the reports",
        variant: "destructive",
      })
    } finally {
      setIsBatchUpdating(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }
  
  if (!isAdmin) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Administrator access is required to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          {adminCount <= 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin/setup')}
              className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Admin Setup
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin/invite')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Invite Admins
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setStatusFilter("all")
              setSelectedReports([])
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {adminCount <= 1 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-yellow-800">Admin Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800">
                  You are currently the only administrator in the system. Consider inviting additional administrators
                  for backup purposes or completing the admin setup process.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <Button
                    size="sm"
                    onClick={() => router.push('/admin/setup')}
                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  >
                    Go to Admin Setup
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/admin/invite')}
                    className="border-yellow-300 text-yellow-800"
                  >
                    Invite Another Admin
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {reports.filter(r => r.status === "pending").length}
            </div>
            <p className="text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {reports.filter(r => r.status === "in_progress").length}
            </div>
            <p className="text-muted-foreground">Currently being handled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {reports.filter(r => r.status === "resolved").length}
            </div>
            <p className="text-muted-foreground">Successfully addressed</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Batch Update Reports</CardTitle>
          <CardDescription>
            Select multiple reports and update their status or assign to municipalities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="batch-status">Set Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger id="batch-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="batch-municipality">Assign to Municipality</Label>
              <Select
                value={selectedMunicipality}
                onValueChange={setSelectedMunicipality}
              >
                <SelectTrigger id="batch-municipality">
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {municipalities.map((muni) => (
                    <SelectItem key={muni.id} value={muni.id || `muni-${muni.name.replace(/\s+/g, '-').toLowerCase()}`}>
                      {muni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleBatchUpdate} 
                disabled={isBatchUpdating || selectedReports.length === 0 || !selectedStatus}
                className="w-full"
              >
                {isBatchUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update {selectedReports.length} Report{selectedReports.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mb-4">
            {selectedReports.length} of {reports.length} reports selected
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedReports.length === reports.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Report Details</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Municipality</div>
                  <div className="col-span-2">Submitted</div>
                </div>
                
                <div className="divide-y">
                  {reports.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No reports found
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-gray-50">
                        <div className="col-span-1">
                          <Checkbox
                            checked={selectedReports.includes(report.id)}
                            onCheckedChange={() => handleSelectReport(report.id)}
                          />
                        </div>
                        <div className="col-span-3">
                          <div className="font-medium truncate">{report.description.substring(0, 40)}...</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {report.id.substring(0, 8)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            By: {report.profiles?.email || "Anonymous"}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm truncate">{report.location}</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">
                            {report.municipality ? 
                              municipalities.find(m => m.id === report.municipality)?.name || report.municipality :
                              "Unassigned"
                            }
                          </span>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm">{format(new Date(report.created_at), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistance(new Date(report.created_at), new Date(), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {["pending", "in_progress", "resolved", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="mt-0">
            <Card>
              <CardContent className="p-0">
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">Report Details</div>
                    <div className="col-span-3">Location</div>
                    <div className="col-span-3">Municipality</div>
                    <div className="col-span-2">Submitted</div>
                  </div>
                  
                  <div className="divide-y">
                    {reports.filter(r => r.status === status).length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No {status.replace('_', ' ')} reports found
                      </div>
                    ) : (
                      reports
                        .filter(r => r.status === status)
                        .map((report) => (
                          <div key={report.id} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-gray-50">
                            <div className="col-span-1">
                              <Checkbox
                                checked={selectedReports.includes(report.id)}
                                onCheckedChange={() => handleSelectReport(report.id)}
                              />
                            </div>
                            <div className="col-span-3">
                              <div className="font-medium truncate">{report.description.substring(0, 40)}...</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {report.id.substring(0, 8)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                By: {report.profiles?.email || "Anonymous"}
                              </div>
                            </div>
                            <div className="col-span-3">
                              <div className="flex items-start gap-1">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="text-sm truncate">{report.location}</span>
                              </div>
                            </div>
                            <div className="col-span-3">
                              <span className="text-sm">
                                {report.municipality ? 
                                  municipalities.find(m => m.id === report.municipality)?.name || report.municipality :
                                  "Unassigned"
                                }
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="text-sm">{format(new Date(report.created_at), 'MMM d, yyyy')}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistance(new Date(report.created_at), new Date(), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 