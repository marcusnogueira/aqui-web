'use client'

import { useTranslation } from 'react-i18next'
import { Database } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../Card'
import { StatCard } from '../StatCard'
import { StarIcon, CheckCircleIcon, MapPinIcon } from '@heroicons/react/24/outline'

type Vendor = Database['public']['Tables']['vendors']['Row']
type VendorLiveSession = Database['public']['Tables']['vendor_live_sessions']['Row']
type VendorStaticLocation = Database['public']['Tables']['vendor_static_locations']['Row']

interface OverviewSectionProps {
  vendor: Vendor
  liveSession: VendorLiveSession | null
  staticLocations: VendorStaticLocation[]
}

export function OverviewSection({ vendor, liveSession, staticLocations }: OverviewSectionProps) {
  const { t } = useTranslation('dashboard')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('overview.rating')}
          value={vendor.average_rating?.toFixed(1) || '0.0'}
          subtitle={t('overview.noReviews')}
          icon={<StarIcon className="w-5 h-5 text-muted-foreground" />}
        />
        <StatCard
          title={t('overview.liveStatus')}
          value={liveSession ? t('overview.live') : t('overview.notLive')}
          subtitle={liveSession ? `${t('overview.startedAt')} ${new Date(liveSession.start_time).toLocaleTimeString()}` : t('overview.goLivePrompt')}
          icon={<CheckCircleIcon className={`w-5 h-5 ${liveSession ? 'text-green-500' : 'text-muted-foreground'}`} />}
        />
        <StatCard
          title={t('overview.locations')}
          value={staticLocations.length}
          subtitle={t('overview.savedLocations')}
          icon={<MapPinIcon className="w-5 h-5 text-muted-foreground" />}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('overview.recentAnnouncements')}</CardTitle>
          <CardDescription>{t('overview.addAnnouncementPrompt')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('overview.noAnnouncements')}</p>
        </CardContent>
      </Card>
    </div>
  )
}