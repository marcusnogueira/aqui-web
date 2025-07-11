'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { signInWithGoogle, signOut } from '@/lib/supabase'
import { signInWithPassword } from '@/lib/supabase-client'
import { useSlideInBottom } from '@/lib/animations'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showAdminPortal, setShowAdminPortal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const modalRef = useSlideInBottom()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
      onClose()
    } catch (error) {
      console.error('Error signing in:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await signInWithPassword(email, password)
      onClose()
      // Refresh the page to update the UI
      window.location.reload()
    } catch (error) {
      console.error('Error signing in:', error)
      alert('Sign in failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminAccess = () => {
    setShowAdminPortal(true)
  }

  const handleAdminLogin = () => {
    onClose()
    router.push('/admin/login')
  }

  const handleEmailTesting = () => {
    setShowAdminPortal(false)
    setShowEmailForm(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative animate-slideInBottom">
        <div className="text-center">
          {showAdminPortal ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
              <p className="text-gray-600 mb-6">Choose your access method</p>
              
              <div className="space-y-3">
                <button
                  onClick={handleAdminLogin}
                  className="w-full flex items-center justify-center space-x-3 bg-indigo-600 text-white rounded-lg px-4 py-3 hover:bg-indigo-700 transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin Login</span>
                </button>
                
                <button
                  onClick={handleEmailTesting}
                  className="w-full bg-[#D85D28] text-white rounded-lg px-4 py-3 hover:bg-[#B8491F] transition-colors"
                >
                  Sign in with Email (Testing)
                </button>
              </div>
              
              <button
                onClick={() => setShowAdminPortal(false)}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
              >
                Back
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AQUI</h2>
              <p className="text-gray-600 mb-6">Sign in to discover amazing local vendors</p>
              
              {!showEmailForm ? (
                <>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
                  </button>
                </>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D85D28]"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D85D28]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D85D28] text-white rounded-lg px-4 py-3 hover:bg-[#B8491F] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Back to Google Sign In
                  </button>
                </form>
              )}
              
              <button
                onClick={onClose}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </>
          )}
        </div>
        
        {/* Admin Access Trigger - Only show when not in admin portal or email form */}
        {!showAdminPortal && !showEmailForm && (
          <button
            onClick={handleAdminAccess}
            className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-[#D85D28] opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-200 cursor-pointer group"
            title="Admin Access"
            aria-label="Admin Access"
          >
            <Shield className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}