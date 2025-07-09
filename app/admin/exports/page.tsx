'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Download, FileText, Users, Store, BarChart3, Clock, CheckCircle, MessageSquare, Database } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSpin } from '@/lib/animations'

interface ExportJob {
  id: string
  type: 'users' | 'vendors' | 'analytics' | 'feedback' | 'reviews' | 'search_logs'
  format: 'csv' | 'json' | 'xlsx'
  status: 'pending' | 'processing' | 'completed' | 'failed'
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
  type: string
  icon: React.ReactNode
  fields: string[]
  estimated_size: string
}

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [exportConfig, setExportConfig] = useState({
    format: 'csv' as 'csv' | 'json' | 'xlsx',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0] // today
    },
    filters: {} as Record<string, any>
  })

  const exportTemplates: ExportTemplate[] = [
    {
      id: 'users',
      name: 'User Data Export',
      description: 'Export user accounts, registration data, and activity metrics',
      type: 'users',
      icon: <Users className="h-6 w-6 text-blue-600" />,
      fields: ['id', 'email', 'name', 'created_at', 'last_login', 'favorite_count', 'review_count'],
      estimated_size: '~2MB for 1000 users'
    },
    {
      id: 'vendors',
      name: 'Vendor Data Export',
      description: 'Export vendor profiles, status, and performance metrics',
      type: 'vendors',
      icon: <Store className="h-6 w-6 text-[#D85D28]" />,
      fields: ['id', 'name', 'business_type', 'status', 'location', 'rating', 'total_reviews', 'created_at'],
      estimated_size: '~1MB for 100 vendors'
    },
    {
      id: 'analytics',
      name: 'Platform Analytics',
      description: 'Export platform usage statistics and performance data',
      type: 'analytics',
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      fields: ['date', 'active_users', 'new_registrations', 'searches', 'vendor_sessions'],
      estimated_size: '~500KB for 90 days'
    },
    {
      id: 'feedback',
      name: 'Customer Feedback',
      description: 'Export customer feedback, complaints, and suggestions',
      type: 'feedback',
      icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
      fields: ['id', 'vendor_name', 'customer_name', 'type', 'subject', 'rating', 'status', 'created_at'],
      estimated_size: '~3MB for 1000 feedback items'
    },
    {
      id: 'reviews',
      name: 'Reviews & Ratings',
      description: 'Export customer reviews and rating data',
      type: 'reviews',
      icon: <FileText className="h-6 w-6 text-yellow-600" />,
      fields: ['id', 'vendor_name', 'customer_name', 'rating', 'comment', 'created_at'],
      estimated_size: '~2MB for 1000 reviews'
    },
    {
      id: 'search_logs',
      name: 'Search Analytics',
      description: 'Export search queries and analytics data',
      type: 'search_logs',
      icon: <Database className="h-6 w-6 text-indigo-600" />,
      fields: ['id', 'query', 'user_id', 'results_count', 'location', 'timestamp'],
      estimated_size: '~1MB for 10000 searches'
    }
  ]

  useEffect(() => {
    fetchExportJobs()
  }, [])

  const fetchExportJobs = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - this would come from API
      const mockJobs: ExportJob[] = [
        {
          id: '1',
          type: 'users',
          format: 'csv',
          status: 'completed',
          created_at: '2024-01-07T10:00:00Z',
          completed_at: '2024-01-07T10:02:00Z',
          file_url: '/exports/users-2024-01-07.csv',
          file_size: 2048576, // 2MB
          record_count: 1250,
          date_range: {
            start: '2024-01-01',
            end: '2024-01-07'
          },
          created_by: 'admin@aqui.com'
        },
        {
          id: '2',
          type: 'analytics',
          format: 'json',
          status: 'processing',
          created_at: '2024-01-07T11:30:00Z',
          date_range: {
            start: '2023-12-01',
            end: '2024-01-07'
          },
          created_by: 'admin@aqui.com'
        },
        {
          id: '3',
          type: 'vendors',
          format: 'xlsx',
          status: 'failed',
          created_at: '2024-01-06T15:20:00Z',
          date_range: {
            start: '2024-01-01',
            end: '2024-01-06'
          },
          created_by: 'admin@aqui.com'
        }
      ]
      
      setJobs(mockJobs)
    } catch (error) {
      console.error('Error fetching export jobs:', error)
      toast.error('Failed to load export jobs')
    } finally {
      setLoading(false)
    }
  }

  const createExport = async () => {
    if (!selectedTemplate) return
    
    try {
      // This would be an API call
      const newJob: ExportJob = {
        id: Date.now().toString(),
        type: selectedTemplate.type as any,
        format: exportConfig.format,
        status: 'pending',
        created_at: new Date().toISOString(),
        date_range: exportConfig.dateRange,
        filters: exportConfig.filters,
        created_by: 'admin@aqui.com'
      }
      
      setJobs(prev => [newJob, ...prev])
      setShowCreateModal(false)
      setSelectedTemplate(null)
      
      toast.success('Export job created successfully')
      
      // Simulate processing
      setTimeout(() => {
        setJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: 'processing' }
            : job
        ))
      }, 1000)
      
      // Simulate completion
      setTimeout(() => {
        setJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { 
                ...job, 
                status: 'completed',
                completed_at: new Date().toISOString(),
                file_url: `/exports/${selectedTemplate.type}-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`,
                file_size: Math.floor(Math.random() * 5000000) + 500000, // Random size between 500KB-5MB
                record_count: Math.floor(Math.random() * 10000) + 100
              }
            : job
        ))
        toast.success('Export completed successfully')
      }, 5000)
      
    } catch (error) {
      console.error('Error creating export:', error)
      toast.error('Failed to create export job')
    }
  }

  const downloadExport = (job: ExportJob) => {
    if (!job.file_url) return
    
    // In a real app, this would download the actual file
    toast.success('Download started')
    
    // Simulate download
    const link = document.createElement('a')
    link.href = '#'
    link.download = job.file_url.split('/').pop() || 'export.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    const processingSpinRef = useSpin(status === 'processing');
    
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <div ref={processingSpinRef} className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <div className="h-4 w-4 bg-red-600 rounded-full"></div>
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const loadingSpinRef = useSpin(loading);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
            <p className="text-gray-600">Generate and download data exports for analysis and reporting</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#D85D28] text-white rounded-md hover:bg-[#B54A1F] flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            New Export
          </button>
        </div>

        {/* Export Templates */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Available Export Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportTemplates.map((template) => (
              <div key={template.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {template.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{template.estimated_size}</p>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowCreateModal(true)
                      }}
                      className="mt-3 text-sm text-[#D85D28] hover:text-[#B54A1F] font-medium"
                    >
                      Create Export
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Export Jobs */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Export Jobs</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {exportTemplates.find(t => t.type === job.type)?.icon}
                          <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                            {job.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                        {job.format}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.date_range.start).toLocaleDateString()} - {new Date(job.date_range.end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(job.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.record_count ? job.record_count.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.file_size ? formatFileSize(job.file_size) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {job.status === 'completed' && job.file_url ? (
                          <button
                            onClick={() => downloadExport(job)}
                            className="text-[#D85D28] hover:text-[#B54A1F] flex items-center"
                            aria-label="Download export"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create Export Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create Export'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setSelectedTemplate(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                
                {!selectedTemplate ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">Select an export type:</p>
                    {exportTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-[#D85D28] hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center">
                          {template.icon}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{template.name}</p>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      {selectedTemplate.icon}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{selectedTemplate.name}</p>
                        <p className="text-xs text-gray-500">{selectedTemplate.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                        value={exportConfig.format}
                        onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value as any }))}
                        aria-label="Select export format"
                      >
                        <option value="csv">CSV (Comma Separated Values)</option>
                        <option value="json">JSON (JavaScript Object Notation)</option>
                        <option value="xlsx">XLSX (Excel Spreadsheet)</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                          value={exportConfig.dateRange.start}
                          onChange={(e) => setExportConfig(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, start: e.target.value }
                          }))}
                          aria-label="Start date for export"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                          value={exportConfig.dateRange.end}
                          onChange={(e) => setExportConfig(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, end: e.target.value }
                          }))}
                          aria-label="End date for export"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Included Fields</label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.fields.map((field) => (
                            <span key={field} className="inline-flex px-2 py-1 text-xs font-medium bg-white text-gray-700 rounded border">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => {
                          setShowCreateModal(false)
                          setSelectedTemplate(null)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createExport}
                        className="px-4 py-2 bg-[#D85D28] text-white rounded-md hover:bg-[#B54A1F] text-sm font-medium flex items-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Create Export
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}