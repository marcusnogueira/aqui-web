'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from '@/lib/database.types'

type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']

interface LiveSessionSectionProps {
  liveSession: VendorLiveSession | null
  onStartLiveSession: (duration?: number | null) => void
  onEndLiveSession: () => void
  isStartingSession: boolean
}

export function LiveSessionSection({ liveSession, onStartLiveSession, onEndLiveSession, isStartingSession }: LiveSessionSectionProps) {
  const { t } = useTranslation('dashboard')
  const [duration, setDuration] = useState<number | null>(null)

  const handleStartSession = () => {
    onStartLiveSession(duration)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-foreground">{t('live.title')}</h1>
      <p className="text-muted-foreground mb-4">{t('live.subtitle')}</p>
      {liveSession ? (
        <div className="bg-card p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-card-foreground">{t('live.activeSession')}</h2>
          <p className="text-card-foreground">{t('live.startedAt')}: {new Date(liveSession.start_time).toLocaleString()}</p>
          {liveSession.auto_end_time && <p className="text-card-foreground">{t('live.autoEndsAt')}: {new Date(liveSession.auto_end_time).toLocaleString()}</p>}
          <button
            onClick={onEndLiveSession}
            className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {t('live.endSession')}
          </button>
        </div>
      ) : (
        <div className="bg-card p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-card-foreground">{t('live.startSession')}</h2>
          <div className="mb-4">
            <label htmlFor="duration" className="block text-sm font-medium text-foreground">{t('live.duration')}</label>
            <select
              id="duration"
              name="duration"
              onChange={e => setDuration(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-input border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="">{t('live.noAutoEnd')}</option>
              <option value="60">{t('live.hours', { count: 1 })}</option>
              <option value="120">{t('live.hours', { count: 2 })}</option>
              <option value="240">{t('live.hours', { count: 4 })}</option>
              <option value="480">{t('live.hours', { count: 8 })}</option>
            </select>
          </div>
          <button
            onClick={handleStartSession}
            disabled={isStartingSession}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-muted"
          >
            {isStartingSession ? t('live.starting') : t('live.start')}
          </button>
        </div>
      )}
    </div>
  )
}
