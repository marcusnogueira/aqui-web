import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/Navigation' // Assuming you have a Navigation component
import VendorMap from '@/components/VendorMap' // VendorMap component

export default async function ExplorePage() {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()
  // Authentication is optional - unauthenticated users can view vendors

  // Fetch active and approved vendors with their live sessions
  const { data: liveSessions, error: liveSessionsError } = await supabase
    .from('vendor_live_sessions')
    .select('*')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (liveSessionsError) {
    console.error('Error fetching live sessions for explore page:', liveSessionsError)
    return (
      <div>
        <Navigation />
        <main className="p-4">
          <h1 className="text-2xl font-bold">Explore Vendors</h1>
          <p className="text-red-500">Could not load vendor data. Please try again later.</p>
        </main>
      </div>
    )
  }

  const vendorIds = liveSessions?.map(session => session.vendor_id).filter((id): id is string => id !== null) || []
  
  const { data: vendors, error } = vendorIds.length > 0 
    ? await supabase
        .from('vendors')
        .select('*')
        .in('id', vendorIds)
        .eq('is_approved', true)
        .eq('is_active', true)
    : { data: [], error: null }

  // Combine vendors with their live sessions
  const vendorsWithLiveSessions = vendors?.map(vendor => {
    const liveSession = liveSessions?.find(session => session.vendor_id === vendor.id)
    return {
      ...vendor,
      live_session: liveSession
    }
  }) || []

  if (error) {
    console.error('Error fetching vendors for explore page:', error)
    // Render a fallback or error state
    return (
      <div>
        <Navigation />
        <main className="p-4">
          <h1 className="text-2xl font-bold">Explore Vendors</h1>
          <p className="text-red-500">Could not load vendor data. Please try again later.</p>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Explore Vendors</h1>
        <div className="h-[600px] w-full">
          {/* The VendorMap component will need to be a client component */}
          <VendorMap vendors={vendorsWithLiveSessions} userLocation={undefined} />
        </div>
      </main>
    </div>
  )
}
