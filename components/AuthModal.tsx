'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success' | ''>('')
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
      setLoading(true);
      clearMessage();
      // Use NextAuth's signIn function for Google
      await signIn('google', { callbackUrl: '/' });
      onClose();
    } catch (error) {
      console.error('Error signing in:', error);
      setMessageWithType('Error signing in with Google.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onClose, clearMessage, setMessageWithType]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      clearMessage();
      // Use NextAuth's signIn function for Apple
      await signIn('apple', { callbackUrl: '/' });
      onClose();
    } catch (error) {
      console.error('Error signing in:', error);
      setMessageWithType('Error signing in with Apple.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onClose, clearMessage, setMessageWithType]);



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
              className="w-full flex items-center justify-center space-x-3 bg-background border border-border rounded-lg px-4 py-3 text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17.253 13.637c.01.03.018.06.018.092 0 2.22-1.638 3.834-4.332 3.834-1.17 0-2.22-.463-2.986-.9-1.027.69-2.14.95-3.2.95-.03 0-.06-.002-.09-.004-.03-.002-.06-.004-.09-.006-1.92-.12-3.36-1.44-4.2-3.3-.9-1.98-.3-4.29.9-5.85.81-.99 1.83-1.59 2.94-1.62 1.05-.03 2.1.42 2.85.9.84-.63 1.89-.96 3.03-.96.3 0 .6.03.9.09.06.01.12.02.18.03 1.8.24 3.09 1.41 3.84 3.18.09.21.165.42.225.63.06.21.105.42.135.63.09.36.135.72.135 1.08zM14.97 9.02c-.69-.84-1.83-1.35-3.03-1.35-.3 0-.6.03-.9.09-.06.01-.12.02-.18.03-.24.04-.48.09-.72.15-.21.06-.42.12-.63.195-.21.075-.405.165-.6.255-.6.3-1.14.72-1.56 1.23-.45.51-.81 1.11-1.05 1.77-.24.66-.36 1.38-.36 2.16 0 .24.01.48.03.72.01.12.02.24.04.36.07.3.16.6.28.87.12.27.27.54.45.78.36.48.81.9 1.32 1.23.51.33 1.08.54 1.68.63.6.09 1.23.06 1.83-.09.6-.15 1.17-.42 1.68-.78.51-.36.96-.81 1.32-1.32.36-.51.63-1.08.78-1.68.15-.6.18-1.23.09-1.83a3.63 3.63 0 0 0-.54-1.56z"/>
              </svg>
              <span>{loading ? 'Signing in...' : 'Continue with Apple'}</span>
            </button>
          </div>

          <div className="mt-4 flex flex-col items-center space-y-2">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Cancel
            </button>
            
            {/* Discreet admin login link */}
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
