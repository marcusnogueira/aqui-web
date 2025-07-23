'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'

type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']

interface LiveSessionSectionProps {
  liveSession: VendorLiveSession | null
  onStartLiveSession: (duration: number | null) => Promise<void>
  onEndLiveSession: () => Promise<void>
  isStartingSession: boolean
}

export function LiveSessionSection({ 
  liveSession, 
  onStartLiveSession, 
  onEndLiveSession, 
  isStartingSession 
}: LiveSessionSectionProps) {
  const [sessionDuration, setSessionDuration] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Timer countdown effect
  useEffect(() => {
    if (liveSession?.auto_end_time && liveSession.is_active) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const endTime = new Date(liveSession.auto_end_time!).getTime()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          // Session should have ended, refresh data
          setTimeRemaining(null)
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      
      return () => clearInterval(interval)
    } else {
      setTimeRemaining(null)
    }
  }, [liveSession?.auto_end_time, liveSession?.is_active])

  const handleStartLiveSession = async () => {
    await onStartLiveSession(sessionDuration)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h2 className="text-xl font-semibold mb-6" style={{ color: '#3A938A' }}>Live Session Management</h2>
      
      {liveSession ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium text-lg">You are currently live!</span>
            {timeRemaining !== null && (
              <span className="text-orange-600 font-medium">
                ⏳ Ending in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Session Details</h3>
              <p className="text-gray-600">Started: {new Date(liveSession.start_time).toLocaleString()}</p>
              <p className="text-gray-600">Location: {liveSession.address || 'Location not specified'}</p>
              <p className="text-gray-600">Coordinates: {liveSession.latitude?.toFixed(4)}, {liveSession.longitude?.toFixed(4)}</p>
              {liveSession.auto_end_time && (
                <p className="text-gray-600">Auto-end: {new Date(liveSession.auto_end_time).toLocaleString()}</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Actions</h3>
              <button
                onClick={onEndLiveSession}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                End Live Session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Live Session</h3>
          <p className="text-gray-600 mb-6">
            Go live to let customers know you're open and ready to serve!
          </p>
          
          <div className="mb-6">
            <label htmlFor="session-duration" className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration (Optional)
            </label>
            <select
              id="session-duration"
              value={sessionDuration || ''}
              onChange={(e) => setSessionDuration(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mission-teal"
            >
              <option value="">No time limit</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
            </select>
            {sessionDuration && (
              <p className="text-sm text-gray-500 mt-1">
                Session will automatically end in {sessionDuration} minutes
              </p>
            )}
          </div>
          
          <button
            onClick={handleStartLiveSession}
            disabled={isStartingSession}
            className="px-6 py-3 rounded-xl font-semibold text-sm uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#D85D28', color: '#FBF2E3' }}
          >
            {isStartingSession ? 'Starting Live Session...' : 'Go Live Now'}
          </button>
        </div>
      )}
    </div>
  )
}