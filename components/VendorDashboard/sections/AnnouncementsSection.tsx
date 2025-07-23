'use client'

import { useState } from 'react'
import { Database } from '@/types/database'

type VendorAnnouncement = Database['public']['Tables']['vendor_announcements']['Row']

interface AnnouncementsSectionProps {
  announcements: VendorAnnouncement[]
  onAddAnnouncement: (announcement: { message: string }) => Promise<void>
}

export function AnnouncementsSection({ announcements, onAddAnnouncement }: AnnouncementsSectionProps) {
  const [newAnnouncement, setNewAnnouncement] = useState({ message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  const validateMessage = (message: string): string => {
    if (!message.trim()) {
      return 'Announcement message is required'
    }
    if (message.trim().length < 10) {
      return 'Announcement must be at least 10 characters long'
    }
    if (message.trim().length > 500) {
      return 'Announcement must be less than 500 characters'
    }
    return ''
  }

  const handleMessageChange = (message: string) => {
    setNewAnnouncement({ message })
    if (validationError) {
      setValidationError(validateMessage(message))
    }
  }

  const handleAddAnnouncement = async () => {
    const error = validateMessage(newAnnouncement.message)
    if (error) {
      setValidationError(error)
      return
    }

    setIsSubmitting(true)
    setValidationError('')
    
    try {
      await onAddAnnouncement(newAnnouncement)
      setNewAnnouncement({ message: '' })
    } catch (error) {
      console.error('Error adding announcement:', error)
      setValidationError('Failed to post announcement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Add Announcement Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Announcement</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="announcement-message" className="block text-sm font-medium text-gray-500 mb-2">
              Message
            </label>
            <textarea
              id="announcement-message"
              placeholder="Share an update with your customers..."
              rows={4}
              value={newAnnouncement.message}
              onChange={(e) => handleMessageChange(e.target.value)}
              className={`w-full px-4 py-3 text-gray-900 placeholder:text-gray-400 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                validationError ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <div>
                {validationError && (
                  <p className="text-sm text-red-600">{validationError}</p>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {newAnnouncement.message.length}/500
              </p>
            </div>
          </div>
          <button
            onClick={handleAddAnnouncement}
            disabled={isSubmitting || !newAnnouncement.message.trim()}
            className="px-6 py-2 rounded-xl font-semibold bg-[#3A938A] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Announcements</h2>
        
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="text-gray-500">No announcements yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first announcement to share updates with customers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#3A938A] rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-[#3A938A]">Announcement</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {announcement.created_at && formatDate(announcement.created_at)}
                  </span>
                </div>
                <p className="text-gray-900 leading-relaxed">
                  {announcement.message || 'No message content'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}