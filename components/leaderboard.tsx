"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type Profile = {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type LeaderboardEntry = {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  rank: number;
};

type ComplaintWithProfile = {
  user_id: string;
  profiles: Profile | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  verified?: boolean;
  clean_up?: boolean;
};

export function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const calculateEnvironmentalPoints = (complaints: ComplaintWithProfile[]) => {
    let points = 0;
    
    complaints.forEach(complaint => {
      // Base points for any report
      points += 10;
      
      // Bonus points for verified reports
      if (complaint.verified) {
        points += 5;
      }
      
      // Bonus points for resolved reports
      if (complaint.status === 'resolved') {
        points += 15;
      }
      
      // Big bonus for clean-up events
      if (complaint.clean_up) {
        points += 50;
      }
    });
    
    return points;
  };

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First fetch all complaints with user profiles
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          user_id,
          status,
          verified,
          clean_up,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .not('user_id', 'is', null);
        
      if (complaintsError) throw complaintsError;
      
      // Then fetch all profiles to include users who haven't made complaints yet
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url');
        
      if (profilesError) throw profilesError;

      // Group complaints by user
      const userComplaintsMap = (complaintsData as unknown as ComplaintWithProfile[]).reduce(
        (acc: Record<string, ComplaintWithProfile[]>, curr) => {
          if (!acc[curr.user_id]) {
            acc[curr.user_id] = [];
          }
          acc[curr.user_id].push(curr);
          return acc;
        }, 
        {}
      );

      // Process all users (including those without complaints)
      const userContributions = profilesData.map(profile => {
        const complaints = userComplaintsMap[profile.id] || [];
        const points = calculateEnvironmentalPoints(complaints);
        
        return {
          user_id: profile.id,
          username: profile.username || 'Anonymous',
          full_name: profile.full_name || 'Anonymous User',
          avatar_url: profile.avatar_url,
          points,
          rank: 0 // Will be calculated after sorting
        };
      });

      // Sort by points and assign ranks
      const sortedLeaderboard = userContributions
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }))
        .filter(entry => entry.points > 0) // Only show users with points
        .slice(0, 5); // Top 5
        
      setLeaderboardData(sortedLeaderboard);
    } catch (error) {
      console.error('Leaderboard error:', error);
      setError('Failed to load leaderboard data');
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500"; // Gold
      case 1: return "text-gray-400"; // Silver
      case 2: return "text-amber-600"; // Bronze
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top Contributors</CardTitle>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            {error}
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No contributions yet. Be the first!
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboardData.map((entry, index) => (
              <div key={entry.user_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.full_name?.split(' ').map(n => n[0]).join('') || 'UU'}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1">
                        <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {entry.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{entry.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {entry.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}