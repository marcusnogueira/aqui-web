'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from '@/lib/database.types'

type VendorAnnouncement = Database['public']['Tables']['vendor_announcements']['Row']

interface AnnouncementsSectionProps {
  announcements: VendorAnnouncement[]
  onAddAnnouncement: (announcement: { message: string }) => void
}

export function AnnouncementsSection({ announcements, onAddAnnouncement }: AnnouncementsSectionProps) {
  const { t } = useTranslation('dashboard')
  const [message, setMessage] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message) return
    setIsPosting(true)
    await onAddAnnouncement({ message })
    setMessage('')
    setIsPosting(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-foreground">{t('announcements.title')}</h1>
      <p className="text-muted-foreground mb-4">{t('announcements.subtitle')}</p>
      <form onSubmit={handleSubmit} className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-foreground">{t('announcements.newAnnouncement')}</h2>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={t('announcements.messagePlaceholder')}
          rows={3}
          className="w-full p-2 border rounded-md bg-input border-border text-foreground"
        />
        <button
          type="submit"
          disabled={isPosting || !message}
          className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-muted"
        >
          {isPosting ? t('announcements.posting') : t('announcements.post')}
        </button>
      </form>
      <div>
        <h2 className="text-lg font-semibold mb-2 text-foreground">{t('announcements.recentAnnouncements')}</h2>
        {announcements.length > 0 ? (
          <ul className="space-y-2">
            {announcements.map(announcement => (
              <li key={announcement.id} className="bg-card p-2 rounded-lg shadow text-sm">
                <p className="text-card-foreground">{announcement.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {announcement.created_at ? new Date(announcement.created_at).toLocaleString() : 'No date'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t('announcements.noAnnouncements')}</p>
        )}
      </div>
    </div>
  )
}
