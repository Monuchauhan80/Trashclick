"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, MapPin, Clock, CheckCircle, AlertCircle, Loader, Award, ChevronRight, Calendar, Loader2, ListTodo, Trophy, Star, Flag, Target } from "lucide-react"
import { useSupabase } from "@/contexts/supabase-context"
import { getUserComplaints, signOut } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { Leaderboard } from "@/components/leaderboard"
import { format } from "date-fns"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userReports, setUserReports] = useState<any[]>([])
  const [profileData, setProfileData] = useState<any>(null)
  const { user, isLoading: authLoading } = useSupabase()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [reportStats, setReportStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    totalReports: 0,
    points: 0,
    rank: "Environmental Guardian",
    nextRank: "Eco Warrior",
    pointsToNextRank: 50,
  })

  useEffect(() => {
    setMounted(true)
    
    // Redirect if not logged in
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      // Fetch user profile data
      const fetchUserProfile = async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (profileError && profileError.code !== 'PGRST104') {
            console.error('Error fetching profile:', profileError)
          } else if (profileData) {
            setProfileData(profileData)
          }
        } catch (err) {
          console.error('Error fetching profile:', err)
        }
      }
      
      // Fetch user reports
      const fetchUserReports = async () => {
        try {
          setIsLoading(true)
          setLoadError(null)
          const { data, error } = await getUserComplaints(user.id)
          
          if (error) {
            console.error('Error fetching reports:', error)
            if (error.code === 'PGRST116') {
              // This is a "relation does not exist" error
              setLoadError("Database tables not set up. Please check Supabase setup.")
            } else {
              setLoadError(error.message)
            }
            return
          }
          
          if (data) {
            setUserReports(data)
            
            // Update stats based on actual data
            const newStats = { ...reportStats }
            newStats.totalReports = data.length
            newStats.pending = 0
            newStats.inProgress = 0
            newStats.resolved = 0
            
            data.forEach((report) => {
              if (report.status === 'pending') newStats.pending++
              else if (report.status === 'in_progress') newStats.inProgress++
              else if (report.status === 'resolved') newStats.resolved++
            })
            
            // Calculate points (10 per report)
            newStats.points = data.length * 10
            
            setReportStats(newStats)
          }
        } catch (err) {
          console.error('Error:', err)
          setLoadError(err instanceof Error ? err.message : 'An unknown error occurred')
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchUserProfile()
      fetchUserReports()
      
      // Set up interval to refresh data every 30 seconds
      const intervalId = setInterval(() => {
        fetchUserProfile()
        fetchUserReports()
      }, 30000)
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId)
    }
  }, [user, authLoading, router])
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }
  
  // Don't render until client-side hydration is complete
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Resolved
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Display an error screen if something went wrong
  if (loadError) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
            <CardDescription className="text-red-600">
              There was an error loading your dashboard data
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-4">
              <p>{loadError}</p>
              <p>
                This might happen if the Supabase database is not properly set up with the required tables.
                Please make sure your database has the 'complaints' and 'profiles' tables as defined in the types.
              </p>
              <div className="p-4 border rounded-md bg-muted overflow-auto">
                <pre className="text-xs">
                  {`CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  email TEXT NOT NULL
);`}
                </pre>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button onClick={() => router.push('/')} variant="outline">
              Return to Home
            </Button>
            <Button onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profileData?.full_name || user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/new">
            <Button>New Report</Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportStats.pending}</div>
                {userReports.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((reportStats.pending / reportStats.totalReports) * 100)}% of your reports
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Loader className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportStats.inProgress}</div>
                {userReports.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((reportStats.inProgress / reportStats.totalReports) * 100)}% of your reports
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportStats.resolved}</div>
                {userReports.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((reportStats.resolved / reportStats.totalReports) * 100)}% of your reports
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportStats.totalReports}</div>
                <p className="text-xs text-muted-foreground">
                  {userReports.length > 0 ? 'Thanks for contributing!' : (
                    <Link href="/reports/new" className="text-primary hover:underline">
                      Submit your first report
                    </Link>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Profile */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="font-medium">{profileData?.full_name || user.email}</h3>
                  {profileData?.username ? (
                    <p className="text-sm text-muted-foreground">@{profileData.username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Member since</span>
                    <span className="font-medium">
                      {new Date(user.created_at || user.updated_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Reports submitted</span>
                    <span className="font-medium">{reportStats.totalReports}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/profile/edit">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Recent Reports */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Reports</CardTitle>
                  <CardDescription>Your latest submitted reports</CardDescription>
                </div>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userReports.length > 0 ? (
                  <div className="space-y-4">
                    {userReports.slice(0, 3).map((report) => (
                      <div key={report.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-1">
                          <h4 className="font-medium">{report.description.substring(0, 30)}...</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{report.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div>{getStatusBadge(report.status)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No reports submitted yet</p>
                    <div className="mt-4">
                      <Link href="/reports/new">
                        <Button variant="outline" size="sm">Submit Your First Report</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Full Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>Complete history of your environmental reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userReports.length > 0 ? (
                <div className="space-y-4">
                  {userReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{report.description.substring(0, 50)}...</h4>
                        <div className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{report.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(report.status)}
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="ghost" size="sm" className="h-8">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">You haven't submitted any reports yet</p>
                  <Link href="/reports/new">
                    <Button>Submit Your First Report</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-8">
          {/* Rewards and Gamification */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Environmental Impact</CardTitle>
                <CardDescription>Track your contribution to the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Environmental Points</span>
                    <span className="text-sm text-muted-foreground">{reportStats.points} points</span>
                  </div>
                  <Progress value={reportStats.points % 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Rank</span>
                    <Badge variant="outline" className="bg-primary/10">
                      {reportStats.rank}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Next Rank</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{reportStats.pointsToNextRank} points needed</span>
                      <Badge variant="outline">{reportStats.nextRank}</Badge>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-4">
                    <Award className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">How to earn more points</h4>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        <li>Submit environmental reports (+10 points each)</li>
                        <li>Get your reports verified (+5 points)</li>
                        <li>Have your reports resolved (+15 points)</li>
                        <li>Participate in community clean-ups (+50 points)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Badges and milestones you've earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-sm font-medium">First Report</span>
                    {reportStats.totalReports > 0 ? (
                      <Badge variant="secondary" className="h-5 rounded-sm px-1 text-xs">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-sm border-dashed px-1 text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-sm font-medium">5 Reports</span>
                    {reportStats.totalReports >= 5 ? (
                      <Badge variant="secondary" className="h-5 rounded-sm px-1 text-xs">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-sm border-dashed px-1 text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-sm font-medium">10 Reports</span>
                    {reportStats.totalReports >= 10 ? (
                      <Badge variant="secondary" className="h-5 rounded-sm px-1 text-xs">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-sm border-dashed px-1 text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-sm font-medium">First Resolved</span>
                    {reportStats.resolved > 0 ? (
                      <Badge variant="secondary" className="h-5 rounded-sm px-1 text-xs">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-sm border-dashed px-1 text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-sm font-medium">5 Resolved</span>
                    {reportStats.resolved >= 5 ? (
                      <Badge variant="secondary" className="h-5 rounded-sm px-1 text-xs">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-sm border-dashed px-1 text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-sm font-medium">100 Points</span>
                    {reportStats.points >= 100 ? (
                      <Badge variant="secondary" className="h-5 rounded-sm px-1 text-xs">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 rounded-sm border-dashed px-1 text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-8">
          <Leaderboard />
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo /> Recent Reports
              </CardTitle>
              <CardDescription>
                Your latest environmental reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reports submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {userReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {report.description.substring(0, 40)}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(report.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => router.push("/reports")}
                className="w-full"
              >
                View All Reports
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

