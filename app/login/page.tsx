"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Loader2, Leaf, Info } from "lucide-react"
import { signIn } from "@/lib/supabase"
import { useSupabase } from "@/contexts/supabase-context"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDbError, setIsDbError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, error: contextError } = useSupabase()
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  useEffect(() => {
    setMounted(true)
    // Redirect if already logged in
    if (user) {
      router.push('/dashboard')
    }
    
    // Check for context errors
    if (contextError) {
      setError(`Authentication error: ${contextError}`)
    }
  }, [user, router, contextError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setIsDbError(false)

    try {
      const { data, error: signInError } = await signIn(formData.email, formData.password)
      
      if (signInError) {
        throw new Error(signInError.message)
      }
      
      // Successful login - user context will update automatically
      router.push('/dashboard')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to sign in. Please try again.'
      setError(errMsg)
      
      // Check if it's likely a database error
      if (errMsg.includes('database') || errMsg.includes('relation') || errMsg.includes('table')) {
        setIsDbError(true)
      }
      
      setIsLoading(false)
    }
  }

  // Don't render until hydration is complete to prevent flashing
  if (!mounted) {
    return null
  }

  // Redirect if already logged in
  if (user) {
    return null
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Enter your credentials to access your account</p>
        </div>
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              <p className="flex items-center font-medium">
                <AlertCircle className="mr-2 h-5 w-5" />
                Authentication Error
              </p>
              <p className="mt-2 text-sm">{error}</p>
              
              {isDbError && (
                <div className="mt-4 p-3 border border-red-200 rounded-md bg-red-50/50">
                  <p className="flex items-start gap-2 text-sm">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      This appears to be a database initialization error. You may need to create the necessary database tables
                      in your Supabase project. Visit the SQL Editor in your Supabase dashboard and run the SQL commands shown
                      in the dashboard to set up the required tables.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

