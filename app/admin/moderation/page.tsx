'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock, Flag, MessageSquare, User } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { MODERATION_STATUS, PRIORITY_LEVELS } from '@/lib/constants'

interface ModerationItem {
  id: string
  type: 'review' | 'vendor_feedback' | 'customer_report'
  content: string
  reporter_id?: string
  target_id: string
  target_type: 'vendor' | 'review' | 'user'
  status: string
  priority: string
  created_at: string
  updated_at: string
  admin_notes?: string
  // Related data
  reporter?: {
    id: string
    full_name: string
    email: string
  }
  target_vendor?: {
    id: string
    business_name: string
  }
  target_user?: {
    id: string
    full_name: string
    email: string
  }
}

interface ModerationStats {
  total: number
  pending: number
  approved: number
  rejected: number
  high_priority: number
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchModerationItems()
    fetchStats()
  }, [typeFilter, statusFilter, priorityFilter])

  const fetchModerationItems = async () => {
    try {
      setLoading(true)
      // This would be implemented when the moderation tables are created
      // For now, we'll show placeholder data
      const mockData: ModerationItem[] = [
        {
          id: '1',
          type: 'review',
          content: 'This vendor was very rude and unprofessional. Would not recommend.',
          target_id: 'vendor-123',
          target_type: 'vendor',
          status: MODERATION_STATUS.PENDING,
          priority: PRIORITY_LEVELS.MEDIUM,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reporter: {
            id: 'user-456',
            full_name: 'John Doe',
            email: 'john@example.com'
          },
          target_vendor: {
            id: 'vendor-123',
            business_name: 'Taco Express'
          }
        },
        {
          id: '2',
          type: 'customer_report',
          content: 'Inappropriate behavior from this user in chat',
          target_id: 'user-789',
          target_type: 'user',
          status: MODERATION_STATUS.PENDING,
          priority: PRIORITY_LEVELS.HIGH,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          reporter: {
            id: 'vendor-123',
            full_name: 'Maria Garcia',
            email: 'maria@tacoexpress.com'
          },
          target_user: {
            id: 'user-789',
            full_name: 'Problem User',
            email: 'problem@example.com'
          }
        }
      ]
      
      setItems(mockData)
    } catch (error) {
      console.error('Error fetching moderation items:', error)
      showToast.error('Failed to load moderation queue')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats for now
      setStats({
        total: 15,
        pending: 8,
        approved: 5,
        rejected: 2,
        high_priority: 3
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      showToast.error('Failed to load statistics')
    }
  }

  const updateModerationItem = async (itemId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      // This would make an API call to update the moderation item
      showToast.success(`Item ${status} successfully`)
      fetchModerationItems()
      fetchStats()
      setShowModal(false)
    } catch (error) {
      console.error('Error updating moderation item:', error)
      showToast.error('Failed to update item')
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case PRIORITY_LEVELS.HIGH:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            High
          </span>
        )
      case PRIORITY_LEVELS.MEDIUM:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Medium
          </span>
        )
      case PRIORITY_LEVELS.LOW:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Low
          </span>
        )
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case MODERATION_STATUS.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case MODERATION_STATUS.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        )
      case MODERATION_STATUS.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <MessageSquare className="h-4 w-4" />
      case 'vendor_feedback':
        return <Flag className="h-4 w-4" />
      case 'customer_report':
        return <User className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
            <p className="text-gray-600">Review and moderate user-generated content</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.high_priority}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="review">Reviews</option>
              <option value="vendor_feedback">Vendor Feedback</option>
              <option value="customer_report">Customer Reports</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
            <button
              onClick={() => {
                setTypeFilter('all')
                setStatusFilter('pending')
                setPriorityFilter('all')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Moderation Items */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Loading moderation items...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            {getTypeIcon(item.type)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.reporter && (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.reporter.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.reporter.email}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {item.target_vendor && (
                            <div className="text-sm font-medium text-gray-900">
                              {item.target_vendor.business_name}
                            </div>
                          )}
                          {item.target_user && (
                            <div className="text-sm font-medium text-gray-900">
                              {item.target_user.full_name}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 capitalize">
                            {item.target_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(item.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setShowModal(true)
                          }}
                          className="text-[#D85D28] hover:text-[#B54A1F]"
                          aria-label="Review item"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Review {selectedItem.type.replace('_', ' ')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-900">
                      {selectedItem.content}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <div>{getPriorityBadge(selectedItem.priority)}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                      rows={3}
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateModerationItem(selectedItem.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateModerationItem(selectedItem.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}