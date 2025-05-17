"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { 
  LoaderIcon, 
  PlusIcon, 
  SearchIcon,
  MapPinIcon,
  ArrowUpDownIcon,
  ClipboardListIcon,
  FilterIcon,
  AlertCircle,
  Briefcase
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"

interface Report {
  id: string
  user_id: string
  description: string
  location: string
  status: "pending" | "in_progress" | "resolved" | "rejected"
  created_at: string
  updated_at?: string
  image_url?: string
  municipality?: string
}

interface Municipality {
    id: string;
    name: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [error, setError] = useState<string | null>(null)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useSupabase()

  // Fetch reports
  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true)
        setError(null)
        
        // If user is not logged in, redirect to login
        if (!user) {
          router.push('/login')
          return
        }
        
        // Fetch Municipalities
        const { data: muniData, error: muniError } = await supabase
          .from('municipalities')
          .select('id, name');
        
        if (muniError) {
            console.error("Error fetching municipalities:", muniError);
            // Handle error appropriately, maybe set default or show toast
            toast({ title: "Error loading departments", variant: "destructive" });
        } else {
            setMunicipalities(muniData || []);
        }
        
        let query = supabase
          .from('complaints')
          .select('*')
          
        // Filter by user ID
        query = query.eq('user_id', user.id)
        
        // Status filter
        if (statusFilter !== "all") {
          query = query.eq('status', statusFilter)
        }
        
        // Sort
        if (sortBy === "newest") {
          query = query.order('created_at', { ascending: false })
        } else if (sortBy === "oldest") {
          query = query.order('created_at', { ascending: true })
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error("Error fetching reports:", error)
          // Check if it's a table not exists error
          if (error.code === 'PGRST116') {
            setError("The complaints table doesn't exist yet. Submit your first report to create it.")
          } else {
            setError(error.message || "Failed to load reports")
          }
          // Continue with empty reports array
          setReports([])
          return
        }
        
        setReports(data || [])
      } catch (error: any) {
        console.error("Error fetching reports:", error)
        setError(error.message || "Failed to load reports")
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
        fetchReports()
    }
  }, [user, router, toast, statusFilter, sortBy, authLoading])

  // Apply search filter to reports
  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      report.description.toLowerCase().includes(searchLower) ||
      report.location.toLowerCase().includes(searchLower) ||
      report.id.toLowerCase().includes(searchLower)
    )
  })

  // Format date to readable string
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pending</Badge>
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">In Progress</Badge>
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">Resolved</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Truncate text to specific length
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Helper function to get municipality name from ID
  const getMunicipalityName = (id: string | undefined | null): string => {
      if (!id) return "N/A"; // Handle case where municipality is null or undefined
      const muni = municipalities.find(m => m.id === id);
      return muni ? muni.name : id; // Return name or ID if not found
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <LoaderIcon className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Reports</h1>
          <p className="text-muted-foreground">
            Manage and track the status of your submitted reports.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/reports/new')}
          className="mt-4 md:mt-0"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> New Report
        </Button>
      </div>
      
      {error && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800">{error}</p>
              <Button 
                variant="link" 
                className="px-0 h-auto py-1 text-amber-700"
                onClick={() => router.push('/reports/new')}
              >
                Submit your first report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[150px]">
              <FilterIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={sortBy} 
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[150px]">
              <ArrowUpDownIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredReports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex justify-center mb-4">
              <ClipboardListIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">No reports found</h2>
            <p className="text-muted-foreground">
              {reports.length === 0 
                ? "You haven't submitted any reports yet." 
                : "No reports match your current search or filters."}
            </p>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button onClick={() => router.push('/reports/new')}>
              <PlusIcon className="mr-2 h-4 w-4" /> Submit New Report
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Card 
              key={report.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/reports/${report.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium">
                    #{report.id.slice(0, 8)}
                  </CardTitle>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="line-clamp-2 text-sm mb-4">
                  {truncateText(report.description, 100)}
                </p>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{report.location}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <MapPinIcon className="h-3 w-3 mr-1.5" />
                  <span>{report.location || "No location provided"}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Briefcase className="h-3 w-3 mr-1.5" />
                  <span>Assigned to: {getMunicipalityName(report.municipality)}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 text-xs text-muted-foreground">
                Submitted on {formatDate(report.created_at)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

