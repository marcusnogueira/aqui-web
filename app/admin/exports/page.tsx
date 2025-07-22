'use client';
import AdminLayout from '@/components/AdminLayout'
import { useSpin } from '@/lib/animations'
import { EXPORT_FORMATS, EXPORT_TYPES, EXPORT_STATUSES } from '@/lib/constants'
import { Users, Store, BarChart3, FileText, Clock, CheckCircle, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { showToast } from '@/lib/toast'

interface ExportJob {
  id: string
  type: keyof typeof EXPORT_TYPES
  format: keyof typeof EXPORT_FORMATS
  status: keyof typeof EXPORT_STATUSES
  created_at: string
  completed_at?: string
  file_url?: string
  file_size?: number
  record_count?: number
  date_range: {
    start: string
    end: string
  }
  filters?: Record<string, any>
  created_by: string
}

interface ExportTemplate {
  id: string
  name: string
  description: string
  type: keyof typeof EXPORT_TYPES
  icon: React.ReactNode
  fields: string[]
  estimated_size: string
}

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)

  const loadingSpinRef = useSpin(loading)
  const processingSpinRef = useSpin(Boolean(processingJobId))

  const [exportConfig, setExportConfig] = useState({
    format: 'CSV' as keyof typeof EXPORT_FORMATS,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    filters: {} as Record<string, any>
  })

  const exportTemplates: ExportTemplate[] = [
    {
      id: 'users',
      name: 'User Data Export',
      description: 'Export user accounts, registration data, and activity metrics',
      type: 'USERS',
      icon: <Users className="h-6 w-6 text-blue-600" />,
      fields: ['id', 'email', 'name', 'created_at', 'last_login', 'favorite_count', 'review_count'],
      estimated_size: '~2MB for 1000 users'
    },
    {
      id: 'vendors',
      name: 'Vendor Data Export',
      description: 'Export vendor profiles, status, and performance metrics',
      type: 'VENDORS',
      icon: <Store className="h-6 w-6 text-[#D85D28]" />,
      fields: ['id', 'name', 'business_type', 'status', 'location', 'rating', 'total_reviews', 'created_at'],
      estimated_size: '~1MB for 100 vendors'
    },
    {
      id: 'sales',
      name: 'Platform Analytics',
      description: 'Export platform usage statistics and performance data',
      type: 'SALES',
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      fields: ['date', 'active_users', 'new_registrations', 'searches', 'vendor_sessions'],
      estimated_size: '~500KB for 90 days'
    },
    {
      id: 'reviews',
      name: 'Reviews & Ratings',
      description: 'Export customer reviews and rating data',
      type: 'REVIEWS',
      icon: <FileText className="h-6 w-6 text-yellow-600" />,
      fields: ['id', 'vendor_name', 'customer_name', 'rating', 'comment', 'created_at'],
      estimated_size: '~2MB for 1000 reviews'
    }
  ]

  useEffect(() => {
    fetchExportJobs()
  }, [])

  const fetchExportJobs = async () => {
    try {
      setLoading(true)
      const mockJobs: ExportJob[] = [
        {
          id: '1',
          type: 'USERS',
          format: 'CSV',
          status: EXPORT_STATUSES.COMPLETED,
          created_at: '2024-01-07T10:00:00Z',
          completed_at: '2024-01-07T10:02:00Z',
          file_url: '/exports/users-2024-01-07.csv',
          file_size: 2048576,
          record_count: 1250,
          date_range: {
            start: '2024-01-01',
            end: '2024-01-07'
          },
          created_by: 'admin@aqui.com'
        }
      ]
      setJobs(mockJobs)
    } catch (error) {
      console.error('Error fetching export jobs:', error)
      showToast.error('Failed to load export jobs')
    } finally {
      setLoading(false)
    }
  }

  const createExport = async () => {
    if (!selectedTemplate) return

    const newJob: ExportJob = {
      id: Date.now().toString(),
      type: selectedTemplate.type,
      format: exportConfig.format,
      status: EXPORT_STATUSES.PENDING,
      created_at: new Date().toISOString(),
      date_range: exportConfig.dateRange,
      filters: exportConfig.filters,
      created_by: 'admin@aqui.com'
    }

    setJobs(prev => [newJob, ...prev])
    setShowCreateModal(false)
    setSelectedTemplate(null)

    showToast.success('Export job created successfully')
    setProcessingJobId(newJob.id)

    setTimeout(() => {
      setJobs(prev => prev.map(job => job.id === newJob.id ? { ...job, status: EXPORT_STATUSES.PROCESSING } : job))
    }, 1000)

    setTimeout(() => {
      setJobs(prev => prev.map(job =>
        job.id === newJob.id
          ? {
              ...job,
              status: EXPORT_STATUSES.COMPLETED,
              completed_at: new Date().toISOString(),
              file_url: `/exports/${selectedTemplate.type}-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`,
              file_size: 1024000,
              record_count: 123
            }
          : job
      ))
      setProcessingJobId(null)
      showToast.success('Export completed successfully')
    }, 4000)
  }

  const getStatusIcon = (status: string) => {
    if (status === EXPORT_STATUSES.PROCESSING) {
      return <div ref={processingSpinRef} className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
    }
    if (status === EXPORT_STATUSES.COMPLETED) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div ref={loadingSpinRef} className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D85D28] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exports...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
        {/* ... render export jobs table and modal as before */}
      </div>
    </AdminLayout>
  )
}
