'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { MessageSquare, Star, Clock, CheckCircle, XCircle, Eye, Filter, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { FEEDBACK_TYPES, PRIORITY_LEVELS } from '@/lib/constants'

interface VendorFeedback {
  id: string
  vendor_id: string
  vendor_name: string
  customer_id: string
  customer_name: string
  feedback_type: keyof typeof FEEDBACK_TYPES
  subject: string
  message: string
  rating?: number
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  priority: keyof typeof PRIORITY_LEVELS
  created_at: string
  updated_at: string
  admin_notes: string | null
  resolved_by?: string
}

interface FeedbackStats {
  total: number
  pending: number
  reviewed: number
  resolved: number
  dismissed: number
  by_type: {
    GENERAL: number
    FEATURE: number
    BUG: number
  }
  avg_rating: number
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<VendorFeedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<VendorFeedback | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchFeedback()
    fetchStats()
  }, [filters, currentPage])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - this would come from API
      const mockFeedback: VendorFeedback[] = [
        {
          id: '1',
          vendor_id: 'v1',
          vendor_name: 'Taco Express',
          customer_id: 'c1',
          customer_name: 'John Doe',
          feedback_type: 'GENERAL',
          subject: 'Long wait time',
          message: 'Had to wait 45 minutes for my order. The app said 15 minutes.',
          rating: 2,
          status: 'pending',
          priority: 'HIGH',
          created_at: '2024-01-07T10:30:00Z',
          updated_at: '2024-01-07T10:30:00Z',
          admin_notes: null
        },
        {
          id: '2',
          vendor_id: 'v2',
          vendor_name: 'Coffee Corner',
          customer_id: 'c2',
          customer_name: 'Jane Smith',
          feedback_type: 'FEATURE',
          subject: 'Add more payment options',
          message: 'Would love to see Apple Pay and Google Pay options added.',
          status: 'reviewed',
          priority: 'MEDIUM',
          created_at: '2024-01-06T14:20:00Z',
          updated_at: '2024-01-07T09:15:00Z',
          admin_notes: 'Forwarded to development team',
          resolved_by: 'admin@aqui.com'
        },
        {
          id: '3',
          vendor_id: 'v3',
          vendor_name: 'Ice Cream Dreams',
          customer_id: 'c3',
          customer_name: 'Mike Johnson',
          feedback_type: 'GENERAL',
          subject: 'Amazing service!',
          message: 'The vendor was super friendly and the ice cream was delicious. Great experience!',
          rating: 5,
          status: 'resolved',
          priority: 'LOW',
          created_at: '2024-01-05T16:45:00Z',
          updated_at: '2024-01-06T08:30:00Z',
          admin_notes: 'Positive feedback shared with vendor',
          resolved_by: 'admin@aqui.com'
        },
        {
          id: '4',
          vendor_id: 'v4',
          vendor_name: 'Burger Bliss',
          customer_id: 'c4',
          customer_name: 'Sarah Wilson',
          feedback_type: 'BUG',
          subject: 'App crashed during order',
          message: 'The app crashed when I tried to place my order. Lost my cart items.',
          status: 'pending',
          priority: 'CRITICAL',
          created_at: '2024-01-07T12:00:00Z',
          updated_at: '2024-01-07T12:00:00Z',
          admin_notes: null
        }
      ]
      
      setFeedback(mockFeedback)
    } catch (error) {
      console.error('Error fetching feedback:', error)
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats data
      const mockStats: FeedbackStats = {
        total: 156,
        pending: 23,
        reviewed: 45,
        resolved: 78,
        dismissed: 10,
        by_type: {
          GENERAL: 77,
          FEATURE: 67,
          BUG: 12
        },
        avg_rating: 3.8
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateFeedbackStatus = async (id: string, status: string, notes?: string) => {
    try {
      // This would be an API call
      setFeedback(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              status: status as any, 
              admin_notes: notes || null,
              resolved_by: 'admin@aqui.com',
              updated_at: new Date().toISOString()
            }
          : item
      ))
      
      toast.success('Feedback status updated successfully')
      setShowModal(false)
      setSelectedFeedback(null)
      fetchStats() // Refresh stats
    } catch (error) {
      console.error('Error updating feedback:', error)
      toast.error('Failed to update feedback status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GENERAL': return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'FEATURE': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'BUG': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const exportFeedback = () => {
    const exportData = feedback.map(item => ({
      id: item.id,
      vendor_name: item.vendor_name,
      customer_name: item.customer_name,
      feedback_type: item.feedback_type,
      subject: item.subject,
      message: item.message,
      rating: item.rating,
      status: item.status,
      priority: item.priority,
      created_at: item.created_at,
      admin_notes: item.admin_notes
    }))
    
    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-feedback-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Feedback data exported successfully')
  }

  const filteredFeedback = feedback.filter(item => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.type !== 'all' && item.feedback_type !== filters.type) return false
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false
    if (filters.search && !(
      item.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.vendor_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(filters.search.toLowerCase())
    )) return false
    return true
  })

  const paginatedFeedback = filteredFeedback.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D85D28] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading feedback...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Vendor Feedback Hub</h1>
            <p className="text-gray-600">Manage customer feedback and vendor communications</p>
          </div>
          <button
            onClick={exportFeedback}
            className="px-4 py-2 bg-[#D85D28] text-white rounded-md hover:bg-[#B54A1F] flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900">{stats.avg_rating}</p>
                <Star className="h-5 w-5 text-yellow-400 ml-1" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm font-medium text-gray-600">Bug Reports</p>
              <p className="text-2xl font-bold text-red-600">{stats.by_type.BUG}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                aria-label="Filter by type"
              >
                <option value="all">All Types</option>
                <option value="GENERAL">General</option>
                <option value="FEATURE">Feature Requests</option>
                <option value="BUG">Bug Reports</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedFeedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.subject}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{item.message}</p>
                        {item.rating && (
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < item.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vendor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(item.feedback_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{item.feedback_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedFeedback(item)
                          setShowModal(true)
                        }}
                        className="text-[#D85D28] hover:text-[#B54A1F]"
                        aria-label="View feedback details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFeedback.length)} of {filteredFeedback.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Feedback Detail Modal */}
        {showModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Feedback Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor</label>
                      <p className="text-sm text-gray-900">{selectedFeedback.vendor_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <p className="text-sm text-gray-900">{selectedFeedback.customer_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <div className="flex items-center mt-1">
                        {getTypeIcon(selectedFeedback.feedback_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {selectedFeedback.feedback_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getPriorityColor(selectedFeedback.priority)}`}>
                        {selectedFeedback.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedFeedback.status)}`}>
                        {selectedFeedback.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedFeedback.subject}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                  
                  {selectedFeedback.rating && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rating</label>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < selectedFeedback.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">({selectedFeedback.rating}/5)</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedFeedback.admin_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedFeedback.admin_notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <label className="block font-medium">Created</label>
                      <p>{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block font-medium">Updated</label>
                      <p>{new Date(selectedFeedback.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedFeedback.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                      <textarea
                        id="admin-notes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                        placeholder="Add notes about this feedback..."
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {selectedFeedback.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value
                          updateFeedbackStatus(selectedFeedback.id, 'reviewed', notes)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Mark as Reviewed
                      </button>
                      <button
                        onClick={() => {
                          const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value
                          updateFeedbackStatus(selectedFeedback.id, 'resolved', notes)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Mark as Resolved
                      </button>
                    </>
                  )}
                  {selectedFeedback.status === 'reviewed' && (
                    <button
                      onClick={() => {
                        const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value
                        updateFeedbackStatus(selectedFeedback.id, 'resolved', notes)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}