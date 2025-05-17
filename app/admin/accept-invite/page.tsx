"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react"

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const { user } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<'valid' | 'invalid' | 'expired' | 'used' | null>(null)
  const [inviteData, setInviteData] = useState<any>(null)

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setInviteStatus('invalid')
        setIsLoading(false)
        return
      }
      
      try {
        // Lookup the invite by token
        const { data: invite, error } = await supabase
          .from('admin_invites')
          .select('*')
          .eq('token', token)
          .single()
        
        if (error || !invite) {
          setInviteStatus('invalid')
          setIsLoading(false)
          return
        }
        
        // Check if invite is expired
        if (new Date(invite.expires_at) < new Date()) {
          setInviteStatus('expired')
          setIsLoading(false)
          return
        }
        
        // Check if invite has already been used
        if (invite.status === 'accepted') {
          setInviteStatus('used')
          setIsLoading(false)
          return
        }
        
        // Check if invite has been revoked
        if (invite.status === 'revoked') {
          setInviteStatus('invalid')
          setIsLoading(false)
          return
        }
        
        // Invite is valid
        setInviteData(invite)
        setInviteStatus('valid')
        setIsLoading(false)
      } catch (error) {
        console.error("Error validating invite:", error)
        setInviteStatus('invalid')
        setIsLoading(false)
      }
    }
    
    validateInvite()
  }, [token])
  
  const handleAcceptInvite = async () => {
    if (!user || !inviteData) {
      toast({
        title: "Login required",
        description: "You must be logged in to accept this invitation",
        variant: "destructive",
      })
      router.push(`/login?redirect=/admin/accept-invite?token=${token}`)
      return
    }
    
    try {
      setIsProcessing(true)
      
      // Update user profile to make them an admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          is_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (profileError) throw profileError
      
      // Mark the invitation as accepted
      const { error: inviteError } = await supabase
        .from('admin_invites')
        .update({
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteData.id)
      
      if (inviteError) throw inviteError
      
      // Success! 
      toast({
        title: "Admin access granted",
        description: "You now have administrator privileges",
      })
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error("Error accepting invite:", error)
      toast({
        title: "Error accepting invitation",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Validating Invitation</CardTitle>
            <CardDescription>Please wait while we validate your invitation</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (inviteStatus === 'invalid') {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is invalid or has been revoked</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  if (inviteStatus === 'expired') {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>This invitation has expired</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  if (inviteStatus === 'used') {
    return (
      <div className="container py-20 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <CardTitle>Invitation Already Used</CardTitle>
            <CardDescription>This invitation has already been accepted</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-20 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle>Accept Admin Invitation</CardTitle>
          <CardDescription>
            You've been invited to become an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p>
            {user ? (
              <>
                You are about to get administrator privileges for <strong>TrashClick</strong>.
                Administrators can manage all reports and access sensitive areas of the application.
              </>
            ) : (
              <>
                Please log in or create an account to accept this invitation.
              </>
            )}
          </p>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          {user ? (
            <Button 
              onClick={handleAcceptInvite} 
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => router.push(`/login?redirect=/admin/accept-invite?token=${token}`)} 
                className="w-full"
              >
                Log In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/register?redirect=/admin/accept-invite?token=${token}`)} 
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