"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/contexts/supabase-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Leaderboard } from "@/components/leaderboard";

export default function MunicipalityPage() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [municipality, setMunicipality] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [newMunicipalityName, setNewMunicipalityName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    fetchMunicipality();
  }, [session, supabase]);

  const fetchMunicipality = async () => {
    setLoading(true);
    try {
      // Check if user is part of a municipality
      const { data: userMunicipality, error: userError } = await supabase
        .from('municipalities_users')
        .select('*, municipalities(*)')
        .eq('user_id', session?.user.id);

      if (userError) throw userError;

      if (userMunicipality && userMunicipality.length > 0) {
        setMunicipality(userMunicipality[0].municipalities);
        
        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('municipalities_users')
          .select('*, profiles(id, email, full_name)')
          .eq('municipality_id', userMunicipality[0].municipality_id);
        
        if (membersError) throw membersError;
        setMembers(membersData || []);

        // Fetch reports assigned to this municipality
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('municipality_id', userMunicipality[0].municipality_id);
        
        if (reportsError) throw reportsError;
        setReports(reportsData || []);
      }
    } catch (error) {
      console.error('Error fetching municipality:', error);
      toast.error('Failed to load municipality data');
    } finally {
      setLoading(false);
    }
  };

  const createMunicipality = async () => {
    if (!newMunicipalityName.trim()) {
      toast.error('Please enter a valid municipality name');
      return;
    }

    setIsCreating(true);
    try {
      // Create new municipality
      const { data: municipalityData, error: municipalityError } = await supabase
        .from('municipalities')
        .insert([{ name: newMunicipalityName }])
        .select();

      if (municipalityError) throw municipalityError;

      if (municipalityData && municipalityData.length > 0) {
        // Associate user with municipality
        const { error: userMunicipalityError } = await supabase
          .from('municipalities_users')
          .insert([{ 
            user_id: session?.user.id, 
            municipality_id: municipalityData[0].id,
            role: 'admin' // First user is admin
          }]);

        if (userMunicipalityError) throw userMunicipalityError;

        toast.success('Municipality created successfully');
        setNewMunicipalityName("");
        fetchMunicipality();
      }
    } catch (error) {
      console.error('Error creating municipality:', error);
      toast.error('Failed to create municipality');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Building2 className="h-8 w-8" /> Municipality Dashboard
      </h1>

      {!municipality ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Municipality</CardTitle>
            <CardDescription>
              Create a new municipality organization to manage reports and members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Municipality Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter municipality name" 
                  value={newMunicipalityName}
                  onChange={(e) => setNewMunicipalityName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createMunicipality} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Municipality"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> 
                  {municipality.name}
                </CardTitle>
                <CardDescription>
                  Your municipality information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p><strong>ID:</strong> {municipality.id}</p>
                  <p><strong>Created:</strong> {new Date(municipality.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> 
                  Members ({members.length})
                </CardTitle>
                <CardDescription>
                  People in your municipality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p>No members found</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li key={member.id} className="flex justify-between items-center p-2 border-b">
                        <span>{member.profiles?.full_name || member.profiles?.email}</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" /> 
                  Reports ({reports.length})
                </CardTitle>
                <CardDescription>
                  Reports assigned to your municipality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p>No reports assigned to your municipality yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {reports.map((report) => (
                      <Card key={report.id} className="overflow-hidden">
                        <div className="p-4">
                          <h3 className="font-medium truncate">{report.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full"
                            onClick={() => router.push(`/reports/${report.id}`)}
                          >
                            View Report
                          </Button>
                        </div>
                      </Card>
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

            <Leaderboard />
          </div>
        </div>
      )}
    </div>
  );
} 