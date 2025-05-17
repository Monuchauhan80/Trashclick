"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useSupabase } from "@/contexts/supabase-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StatusUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
  currentStatus: string
  currentMunicipality?: string
}

export function StatusUpdateModal({
  isOpen,
  onClose,
  reportId,
  currentStatus,
  currentMunicipality = ""
}: StatusUpdateModalProps) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState("")
  const [municipality, setMunicipality] = useState(currentMunicipality)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [municipalities, setMunicipalities] = useState<{id: string, name: string}[]>([])
  const { user } = useSupabase()
  const { toast } = useToast()

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
  
  useEffect(() => {
    // Fetch available municipalities
    const fetchMunicipalities = async () => {
      try {
        const { data, error } = await supabase
          .from('municipalities')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setMunicipalities(data);
        }
      } catch (error) {
        console.error("Error fetching municipalities:", error);
        // Default municipalities if table doesn't exist yet
        setMunicipalities([
          { id: "city-hall", name: "City Hall" },
          { id: "waste-management", name: "Waste Management Department" },
          { id: "parks-recreation", name: "Parks & Recreation" },
          { id: "public-works", name: "Public Works" },
          { id: "environmental-services", name: "Environmental Services" }
        ]);
      }
    };
    
    if (isOpen && isAdmin) {
      fetchMunicipalities();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verify admin status before allowing updates
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can update report status",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from('complaints')
        .update({
          status,
          municipality: municipality || null,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
      
      if (error) throw error
      
      toast({
        title: "Status updated",
        description: "The report status has been successfully updated."
      })
      
      onClose()
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update report status",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Batch update function for admin dashboard
  const batchUpdateReports = async (reportIds: string[], newStatus: string, municipalityId?: string) => {
    if (!isAdmin) return;
    
    try {
      setIsSubmitting(true);
      
      // Update each report in sequence
      const updates = reportIds.map(id => 
        supabase
          .from('complaints')
          .update({
            status: newStatus,
            municipality: municipalityId || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );
      
      // Wait for all updates to complete
      await Promise.all(updates);
      
      toast({
        title: "Batch update complete",
        description: `Successfully updated ${reportIds.length} reports.`
      });
      
    } catch (error: any) {
      console.error("Error in batch update:", error);
      toast({
        title: "Batch update failed",
        description: error.message || "Failed to update multiple reports",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Admin: Update Report Status</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!isAdmin && (
            <div className="bg-red-50 p-3 rounded-md text-sm mb-4 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-600">Administrator Access Required</p>
                <p>You need administrator privileges to update report status. Please contact an administrator for assistance.</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-3 rounded-md text-sm mb-4">
            <p className="font-medium mb-1">Why update the status?</p>
            <p>Keeping the report status updated helps track progress and informs users about the current state of the issue.</p>
          </div>
          
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="municipality">Assign to Municipality/Department</Label>
              <Select
                value={municipality}
                onValueChange={setMunicipality}
                disabled={!isAdmin}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a municipality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Unassigned --</SelectItem>
                  {municipalities.map((muni) => (
                    <SelectItem key={muni.id} value={muni.id}>
                      {muni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign this report to the appropriate department for handling
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="font-medium">Status</h3>
            <RadioGroup 
              value={status} 
              onValueChange={setStatus}
              className="grid grid-cols-2 gap-2"
              disabled={!isAdmin}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending" className="flex flex-col">
                  <span>Pending</span>
                  <span className="text-xs text-muted-foreground">Issue reported, not yet addressed</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_progress" id="in_progress" />
                <Label htmlFor="in_progress" className="flex flex-col">
                  <span>In Progress</span>
                  <span className="text-xs text-muted-foreground">Currently being worked on</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resolved" id="resolved" />
                <Label htmlFor="resolved" className="flex flex-col">
                  <span>Resolved</span>
                  <span className="text-xs text-muted-foreground">Issue has been fixed</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex flex-col">
                  <span>Rejected</span>
                  <span className="text-xs text-muted-foreground">Issue couldn't be addressed</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status update"
              className="h-32"
              disabled={!isAdmin}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isAdmin}
              variant={isAdmin ? "default" : "secondary"}
            >
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 