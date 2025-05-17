"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/contexts/supabase-context"
import { supabase } from "@/lib/supabase"
import { Loader2, Shield, CheckCircle, AlertCircle, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export default function AdminInvitePage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/login?redirect=/admin/invite')
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
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAdminStatus()
  }, [user, router])
  
  useEffect(() => {
    const fetchPendingInvites = async () => {
      if (!isAdmin) return
      
      try {
        // Create admin_invites table if it doesn't exist
        try {
          await supabase.rpc('create_admin_invites_if_not_exists')
        } catch (error) {
          console.error("Error with RPC call:", error)
          // Fallback direct SQL method handled by backend
        }
        
        const { data, error } = await supabase
          .from('admin_invites')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          
        if (error) throw error
        
        setPendingInvites(data || [])
      } catch (error) {
        console.error("Error fetching pending invites:", error)
      }
    }
    
    if (isAdmin) {
      fetchPendingInvites()
    }
  }, [isAdmin])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to invite",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSending(true)
      
      // Check if there's already a pending invite for this email
      const { data: existingInvite, error: checkError } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('email', inviteEmail)
        .eq('status', 'pending')
        .single()
      
      if (existingInvite) {
        toast({
          title: "Invite already exists",
          description: `An invitation for ${inviteEmail} is already pending`,
          variant: "destructive",
        })
        return
      }
      
      // Check if this user already has an account and is an admin
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('email', inviteEmail)
        .single()
      
      if (existingUser && (existingUser.role === 'admin' || existingUser.is_admin === true)) {
        toast({
          title: "Already an admin",
          description: `${inviteEmail} is already an administrator`,
          variant: "destructive",
        })
        return
      }
      
      // Generate a unique token for this invite
      const token = uuidv4()
      
      // Create the invite
      const { error } = await supabase
        .from('admin_invites')
        .insert({
          email: inviteEmail,
          token,
          invited_by: user?.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
      
      if (error) throw error
      
      // Send invitation email (this would typically be done by a server function)
      // For now, we'll just show the invite link
      const inviteUrl = `${window.location.origin}/admin/accept-invite?token=${token}`
      
      toast({
        title: "Invitation created",
        description: "Share this link with the invitee (in a real app, this would be emailed automatically)",
      })
      
      // Show the invitation link (in production, this would be sent via email)
      alert(`Share this invitation link: ${inviteUrl}`)
      
      // Reset form and refresh invites
      setInviteEmail("")
      const { data: updatedInvites } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      setPendingInvites(updatedInvites || [])
    } catch (error: any) {
      console.error("Error creating invite:", error)
      toast({
        title: "Error creating invitation",
        description: error.message || "Failed to create invitation",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }
  
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setIsRevoking(true)
      
      const { error } = await supabase
        .from('admin_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId)
      
      if (error) throw error
      
      toast({
        title: "Invitation revoked",
        description: "The invitation has been successfully revoked",
      })
      
      // Refresh the list of pending invites
      const { data: updatedInvites } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      setPendingInvites(updatedInvites || [])
    } catch (error: any) {
      console.error("Error revoking invite:", error)
      toast({
        title: "Error revoking invitation",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive",
      })
    } finally {
      setIsRevoking(false)
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Invitations</h1>
          <p className="text-muted-foreground">Invite users to become administrators</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Invitation</CardTitle>
            <CardDescription>
              Send an invitation to a user to grant them administrator access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The user will receive an invitation link to become an administrator
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that have been sent but not yet accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <div className="text-center p-8 border rounded-md bg-gray-50">
                <p className="text-muted-foreground">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRevokeInvite(invite.id)}
                      disabled={isRevoking}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Revoke</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 