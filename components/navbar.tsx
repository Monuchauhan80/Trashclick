"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Leaf, Menu, X, User, LogOut, ShieldAlert, Building2, Home, Trophy, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/contexts/supabase-context"
import { signOut, supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    maplibregl: {
      Map: new (options: any) => any;
      NavigationControl: new () => any;
      Marker: new (options: any) => any;
    };
  }
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMunicipalityUser, setIsMunicipalityUser] = useState(false)
  const { user, isLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
          setIsAdmin(false);
          setIsMunicipalityUser(false);
          return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, is_admin, municipality_id') 
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin' || data?.is_admin === true);
        setIsMunicipalityUser(!!data?.municipality_id); 
        
      } catch (error) {
        console.error("Error checking user status:", error);
        setIsAdmin(false);
        setIsMunicipalityUser(false);
      }
    };
    
    if (user) {
      checkUserStatus();
    } else {
        setIsAdmin(false);
        setIsMunicipalityUser(false);
    }
  }, [user]); 

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleSignOut = async () => {
    await signOut()
    setIsAdmin(false)
    setIsMunicipalityUser(false)
    router.push('/')
    setIsMenuOpen(false)
  }

  if (!mounted || isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TrashClick</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TrashClick</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              <Link href="/reports" className="text-sm font-medium hover:text-primary">
                My Reports
              </Link>
              <Link href="/leaderboard" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link href="/community" className="text-sm font-medium hover:text-primary flex items-center gap-1">
                <Users className="h-4 w-4" />
                Community
              </Link>
              {isAdmin && (
                <Link href="/admin/dashboard" className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
              {!isAdmin && isMunicipalityUser && ( 
                <Link href="/department/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  Department
                </Link>
              )}
              <Link href="/municipality">
                <Button variant="outline" size="sm" className="gap-1">
                  <Building2 className="h-4 w-4" />
                  Municipality
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/about" className="text-sm font-medium hover:text-primary">
                About
              </Link>
              <Link href="/community" className="text-sm font-medium hover:text-primary">
                Community
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "container md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isMenuOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="flex flex-col space-y-3 pb-4">
          <Link href="/" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/reports"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                My Reports
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm font-medium hover:text-primary flex items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link
                href="/community"
                className="text-sm font-medium hover:text-primary flex items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                Community
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin/dashboard" 
                  className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  Admin Dashboard
                </Link>
              )}
              {!isAdmin && isMunicipalityUser && ( 
                <Link 
                  href="/department/dashboard" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Department Dashboard
                </Link>
              )}
              <Link href="/municipality" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <Building2 className="h-4 w-4" />
                  Municipality
                </Button>
              </Link>
              <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full gap-1" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/about"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/community"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </Link>
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}