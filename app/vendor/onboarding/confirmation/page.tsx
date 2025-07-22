'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import { clientAuth } from '@/lib/auth-helpers'
import { USER_ROLES } from '@/lib/constants'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface Vendor {
  id: string
  business_name: string
  status: string
  business_type: string
  subcategory: string
}

function OnboardingConfirmationContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (status === 'loading') return
    checkAuthAndFetchVendor()
  }, [session, status])

  const checkAuthAndFetchVendor = async () => {
    try {
      if (!session?.user || !supabase) {
        router.push('/')
        return
      }

      // Get user profile
      const userProfileResult = await clientAuth.getUserProfile(session.user.id!)
      if (!userProfileResult.success || !userProfileResult.data || userProfileResult.data.active_role !== USER_ROLES.VENDOR) {
        router.push('/')
        return
      }

      // Fetch vendor data
      const vendorResult = await supabase
        .from('vendors')
        .select('id, business_name, status, business_type, subcategory')
        .eq('user_id', session.user.id!)
        .single()
      
      const { data: vendorData, error } = vendorResult || { data: null, error: null }

      if (error || !vendorData) {
        router.push('/vendor/onboarding')
        return
      }

      setVendor(vendorData as any)
    } catch (error) {
      console.error('Error fetching vendor data:', error)
      router.push('/vendor/onboarding')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = () => {
    if (!vendor) return ''
    
    switch (vendor.status) {
      case 'pending':
        return 'Your application is currently under review. Our team will review your submission and notify you via email once a decision has been made.'
      case 'approved':
      case 'active':
        return 'Congratulations! Your vendor application has been approved. You can now start using all vendor features.'
      case 'rejected':
        return 'Your application was not approved. Please check your email for details or contact support for assistance.'
      default:
        return 'Your application has been submitted successfully.'
    }
  }

  const getNextSteps = () => {
    if (!vendor) return []
    
    switch (vendor.status) {
      case 'pending':
        return [
          'Check your email regularly for updates',
          'Ensure your contact information is up to date',
          'Review our vendor guidelines while you wait'
        ]
      case 'approved':
      case 'active':
        return [
          'Complete your vendor profile with photos and detailed descriptions',
          'Set up your static locations where customers can find you',
          'Start your first live session to begin serving customers'
        ]
      case 'rejected':
        return [
          'Review the rejection reason in your email',
          'Contact support if you need clarification',
          'Consider reapplying after addressing the issues'
        ]
      default:
        return ['Visit your vendor dashboard to manage your profile']
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mission-teal"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/')
    return null
  }

  if (!vendor) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-lg text-gray-600">
            Welcome to Aqui Vendors, {vendor.business_name}!
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Application Status</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              vendor.status === 'approved' || vendor.status === 'active'
                ? 'bg-green-100 text-green-800'
                : vendor.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Business Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Business Name:</span> {vendor.business_name}</p>
                <p><span className="font-medium">Type:</span> {vendor.business_type}</p>
                {vendor.subcategory && (
                  <p><span className="font-medium">Subcategory:</span> {vendor.subcategory}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
              <p className="text-gray-600 text-sm">
                {getStatusMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
          <ul className="space-y-3">
            {getNextSteps().map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 bg-mission-teal text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-600">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/vendor/dashboard')}
            className="flex-1 bg-mission-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>

        {/* Support Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Have questions? Contact our support team at{' '}
            <a href="mailto:support@aqui.app" className="text-mission-teal hover:underline">
              support@aqui.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingConfirmation() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
      <OnboardingConfirmationContent />
    </Suspense>
  )
}