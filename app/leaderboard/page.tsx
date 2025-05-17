"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"

interface LeaderboardEntry {
  id: string
  username: string
  points: number
  rank: number
  avatar_url?: string
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points, avatar_url')
        .order('points', { ascending: false })
        .limit(100)

      if (error) throw error

      const leaderboardData = data.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

      setLeaderboard(leaderboardData)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500'
      case 2:
        return 'text-gray-400'
      case 3:
        return 'text-amber-600'
      default:
        return 'text-gray-600'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Star className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  if (loading) {
    return <LeaderboardSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Community Leaderboard</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-semibold text-gray-600">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-7">User</div>
            <div className="col-span-4 text-right">Points</div>
          </div>

          <div className="divide-y">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-1 flex items-center justify-center">
                  <div className={`flex items-center gap-2 ${getRankColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                    <span className="font-medium">{entry.rank}</span>
                  </div>
                </div>
                <div className="col-span-7 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <div className="col-span-4 flex items-center justify-end">
                  <span className="font-semibold text-blue-600">{entry.points.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mx-auto mb-8" />
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50">
            <Skeleton className="h-6 w-16 col-span-1 mx-auto" />
            <Skeleton className="h-6 w-32 col-span-7" />
            <Skeleton className="h-6 w-24 col-span-4 ml-auto" />
          </div>

          <div className="divide-y">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-4">
                <Skeleton className="h-10 w-10 col-span-1 mx-auto rounded-full" />
                <div className="col-span-7 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-6 w-24 col-span-4 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 