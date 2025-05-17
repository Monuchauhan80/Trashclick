import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin, Shield, BarChart, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Simplified with better colors */}
      <section className="bg-gradient-to-r from-green-500 to-green-400 py-20 md:py-28">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Making Our Environment
            <span className="block mt-2">Cleaner, One Report at a Time</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white">
            TrashClick empowers citizens to report environmental issues and track their resolution.
            Together, we can create cleaner, healthier communities.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            <a href="/reports/new" className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-lg font-semibold text-green-600 shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a href="/reports" className="inline-flex items-center justify-center rounded-md border border-white px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2">
              View Reports
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-16">
            Why Report Environmental Issues?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-50 rounded-xl p-8 text-center transition-all hover:shadow-lg border border-gray-100">
              <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Identify Problem Areas</h3>
              <p className="text-gray-600">
                Pinpoint exact locations of environmental issues so they can be addressed efficiently.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center transition-all hover:shadow-lg border border-gray-100">
              <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <Shield className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Protect Your Community</h3>
              <p className="text-gray-600">
                Keep your neighborhood safe from pollution, illegal dumping, and environmental hazards.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center transition-all hover:shadow-lg border border-gray-100">
              <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <BarChart className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-gray-600">
                Monitor the resolution of reported issues and see real change in your community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <span className="text-4xl font-bold">1</span>
              </div>
              <h3 className="mb-3 text-2xl font-semibold">Submit a Report</h3>
              <p className="text-gray-600 text-lg">
                Take a photo of the environmental issue, add location details, and submit your report in seconds.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <span className="text-4xl font-bold">2</span>
              </div>
              <h3 className="mb-3 text-2xl font-semibold">Officials Review</h3>
              <p className="text-gray-600 text-lg">
                Local administrators review and prioritize reports, assigning them to appropriate departments.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <span className="text-4xl font-bold">3</span>
              </div>
              <h3 className="mb-3 text-2xl font-semibold">Issue Resolved</h3>
              <p className="text-gray-600 text-lg">
                Track the progress of your report until the environmental issue is completely resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section with Better Visuals */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">Our Impact</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-6xl font-bold text-green-500 mb-4">5,000+</div>
              <p className="text-2xl font-medium mb-4">Reports Submitted</p>
              <p className="text-gray-600">Our platform has received thousands of environmental reports from concerned citizens.</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-6xl font-bold text-green-500 mb-4">92%</div>
              <p className="text-2xl font-medium mb-4">Issues Resolved</p>
              <p className="text-gray-600">The vast majority of reported environmental issues are successfully addressed.</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-6xl font-bold text-green-500 mb-4">150+</div>
              <p className="text-2xl font-medium mb-4">Communities Served</p>
              <p className="text-gray-600">We're helping cities and towns across the country become cleaner and healthier.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-500 py-20">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-white text-xl max-w-2xl mx-auto mb-10">
            Join thousands of citizens who are actively improving their communities by reporting environmental issues.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="/reports/new" className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3 text-xl font-semibold text-green-600 shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Get Started Now
            </a>
            <a href="/about" className="inline-flex items-center justify-center rounded-md border border-white px-8 py-3 text-xl font-semibold text-white shadow-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2">
              Learn More
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

