"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"
import { Loader2, Shield, Lock, AlertTriangle } from "lucide-react"

export default function AdminSetupPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [setupKey, setSetupKey] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminExists, setAdminExists] = useState(false)
  const [setupKeyRequired, setSetupKeyRequired] = useState(false)
  
  // The secret key is just a simple validation - in a real production app,
  // you would use a proper secure mechanism or environment variable
  const ADMIN_SETUP_KEY = "TRASHCLICK_ADMIN_SETUP_2024"

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check if any admin exists in the system
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .or('role.eq.admin,is_admin.eq.true')
          .limit(1)
          
        if (error) throw error
        
        // If admins exist, show message
        if (data && data.length > 0) {
          setAdminExists(true)
        } else {
          // If we're in production or staging, require setup key
          const host = window.location.hostname
          if (host !== 'localhost' && host !== '127.0.0.1') {
            setSetupKeyRequired(true)
          }
        }
      } catch (error) {
        console.error("Error checking admin existence:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAdminStatus()
  }, [])
  
  const handleSetupAdmin = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You must be logged in to become the initial admin",
        variant: "destructive",
      })
      router.push('/login?redirect=/admin/setup')
      return
    }
    
    if (setupKeyRequired && setupKey !== ADMIN_SETUP_KEY) {
      toast({
        title: "Invalid setup key",
        description: "The setup key you entered is not valid",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsProcessing(true)
      
      // Double-check that no admins exist (race condition protection)
      const { data: existingAdmins } = await supabase
        .from('profiles')
        .select('id')
        .or('role.eq.admin,is_admin.eq.true')
        .limit(1)
        
      if (existingAdmins && existingAdmins.length > 0) {
        setAdminExists(true)
        toast({
          title: "Setup already completed",
          description: "An administrator already exists in the system",
          variant: "destructive",
        })
        return
      }
      
      // Make current user an admin
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          is_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      // Success!
      toast({
        title: "Setup complete",
        description: "You are now the administrator of TrashClick",
      })
      
      // Log action for audit purposes
      try {
        await supabase.from('admin_logs').insert({
          action: 'initial_setup',
          user_id: user.id,
          details: 'Initial admin setup completed',
          created_at: new Date().toISOString()
        })
      } catch (logError) {
        console.error("Error logging admin setup:", logError)
      }
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error("Error setting up admin:", error)
      toast({
        title: "Setup failed",
        description: error.message || "Failed to complete admin setup",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
  
  if (adminExists) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Setup Already Completed</CardTitle>
            <CardDescription>
              An administrator already exists in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm">
              If you need admin access, please contact an existing administrator to send you an invitation.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-20 flex justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle>Initial Admin Setup</CardTitle>
          <CardDescription>
            Set up the first administrator account for TrashClick
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="bg-amber-50 p-4 rounded-md text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">You need to log in first</p>
                <p className="text-sm">Please create an account or log in to become the administrator.</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-md text-blue-800">
              <p className="font-medium">You are about to become the admin</p>
              <p className="text-sm mt-1">
                As an administrator, you will have full control over TrashClick, including user management,
                report handling, and system configuration.
              </p>
            </div>
          )}
          
          {setupKeyRequired && (
            <div className="space-y-2">
              <Label htmlFor="setupKey">Admin Setup Key</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="setupKey"
                  type="password"
                  placeholder="Enter the setup key"
                  className="pl-9"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This security key is required to prevent unauthorized admin access
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          {user ? (
            <Button 
              onClick={handleSetupAdmin}
              className="w-full"
              disabled={isProcessing || (setupKeyRequired && !setupKey)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Admin Setup"
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => router.push('/login?redirect=/admin/setup')}
                className="w-full"
              >
                Log In
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/register?redirect=/admin/setup')}
                className="w-full"
              >
                Create Account
              </Button>
            </>
          )}
          <Button 
            variant="ghost"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 