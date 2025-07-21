'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success' | ''>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const setMessageWithType = useCallback((msg: string, type: 'error' | 'success') => {
    setMessage(msg)
    setMessageType(type)
  }, [])

  const clearMessage = useCallback(() => {
    setMessage('')
    setMessageType('')
  }, [])

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true)
      clearMessage()
      await signIn('google', { callbackUrl: '/' })
      onClose()
    } catch (error) {
      console.error('Error signing in:', error)
      setMessageWithType('Error signing in with Google.', 'error')
    } finally {
      setLoading(false)
    }
  }, [onClose, clearMessage, setMessageWithType])

  const handleAppleSignIn = useCallback(async () => {
    try {
      setLoading(true)
      clearMessage()
      await signIn('apple', { callbackUrl: '/' })
      onClose()
    } catch (error) {
      console.error('Error signing in:', error)
      setMessageWithType('Error signing in with Apple.', 'error')
    } finally {
      setLoading(false)
    }
  }, [onClose, clearMessage, setMessageWithType])

  const handleCredentialsSignIn = useCallback(async () => {
    try {
      setLoading(true)
      clearMessage()

      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0], // fallback default
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setMessageWithType(result.error || 'Failed to sign in', 'error')
        return
      }

      const nextAuthRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (nextAuthRes?.error) {
        setMessageWithType(nextAuthRes.error, 'error')
      } else {
        onClose()
        router.refresh()
      }
    } catch (error) {
      console.error('Error signing in:', error)
      setMessageWithType('Unexpected error. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }, [email, password, onClose, clearMessage, setMessageWithType, router])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 relative shadow-lg animate-in slide-in-from-bottom-4 duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Aqui</h2>
          <p className="text-muted-foreground mb-6">Sign in to your account</p>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm transition-all duration-200 ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-background border border-border rounded-lg px-4 py-3 text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Continue with Apple'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs text-muted-foreground uppercase">
                <span className="bg-background px-2">or sign in with email</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCredentialsSignIn()
              }}
              className="space-y-2"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mission-teal text-white px-4 py-2 rounded hover:bg-opacity-90 text-sm"
              >
                {loading ? 'Signing in...' : 'Sign in with Email'}
              </button>
            </form>
          </div>

          <div className="mt-4 flex flex-col items-center space-y-2">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Cancel
            </button>
            <a
              href="/admin/login"
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors opacity-50 hover:opacity-100"
              title="Admin Access"
            >
              •
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
