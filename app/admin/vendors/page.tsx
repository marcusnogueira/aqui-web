'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, Edit2, MoreHorizontal, Trash2, UserCheck, UserX, Square, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminVendorView } from '@/types/vendor'
import { VENDOR_STATUSES, BUSINESS_CATEGORIES, PAGINATION } from '@/lib/constants'

type Vendor = AdminVendorView

interface VendorStats {
  vendors: {
    total: number
    approved: number
    pending: number
    active: number
    inactive: number
  }
  sessions: {
    currentlyLive: number
    totalSessions24h: number
    averageSessionDuration: number
  }
  recent: {
    newVendorsLast7Days: number
    dailyRegistrations: { date: string; count: number }[]
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT,
    total: 0,
    totalPages: 0
  })
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'approved', 'pending', 'rejected'
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Batch selection
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set())
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)

  useEffect(() => {
    fetchVendors()
    fetchStats()
  }, [pagination.page, searchTerm, statusFilter])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/vendors?${params}`)
      if (!response.ok) throw new Error('Failed to fetch vendors')
      
      const data = await response.json()
      setVendors(data.vendors)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/vendors/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load statistics')
    }
  }

  const updateVendorStatus = async (vendorId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error(`Failed to update vendor status to ${status}`);
      
      toast.success(`Vendor status updated to ${status}`);
      fetchVendors();
      fetchStats();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    }
  };

  const updateVendor = async (vendorId: string, updates: Partial<Vendor>) => {
    // Separate status update from other updates
    const { status, ...otherUpdates } = updates;

    if (status) {
      await updateVendorStatus(vendorId, status as string);
    }

    if (Object.keys(otherUpdates).length > 0) {
      try {
        const response = await fetch(`/api/admin/vendors/${vendorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(otherUpdates),
        });

        if (!response.ok) throw new Error('Failed to update vendor details');
        
        toast.success('Vendor details updated successfully');
      } catch (error) {
        console.error('Error updating vendor details:', error);
        toast.error('Failed to update vendor details');
      }
    }

    fetchVendors();
    fetchStats();
    setShowModal(false);
  }

  // Batch operations
  const handleSelectAll = () => {
    if (selectedVendors.size === vendors.length) {
      setSelectedVendors(new Set())
    } else {
      setSelectedVendors(new Set(vendors.map(v => v.id)))
    }
  }

  const handleSelectVendor = (vendorId: string) => {
    const newSelected = new Set(selectedVendors)
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId)
    } else {
      newSelected.add(vendorId)
    }
    setSelectedVendors(newSelected)
  }

  const handleBatchAction = async (action: 'approve' | 'reject') => {
    setBatchAction(action)
    setShowBatchConfirm(true)
  }

  const executeBatchAction = async () => {
    if (!batchAction || selectedVendors.size === 0) return

    setBatchLoading(true)
    try {
      const vendorIds = Array.from(selectedVendors)
      const response = await fetch('/api/admin/vendors/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorIds,
          action: batchAction
        })
      })

      if (!response.ok) throw new Error('Failed to execute batch action')
      
      const result = await response.json()
      toast.success(`Successfully ${batchAction}d ${result.updated} vendors`)
      
      // Reset selection and refresh data
      setSelectedVendors(new Set())
      fetchVendors()
      fetchStats()
    } catch (error) {
      console.error('Error executing batch action:', error)
      toast.error(`Failed to ${batchAction} vendors`)
    } finally {
      setBatchLoading(false)
      setShowBatchConfirm(false)
      setBatchAction(null)
    }
  }

  const getBatchActionText = () => {
    switch (batchAction) {
      case 'approve': return 'approve'
      case 'reject': return 'reject'
      default: return ''
    }
  }

  const getStatusBadge = (vendor: Vendor) => {
    switch (vendor.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {String(vendor.status)}
          </span>
        );
    }
  }

  const isCurrentlyLive = (vendor: Vendor) => {
    return vendor.vendor_live_sessions.some(session => session.is_active)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-gray-600">Manage vendor approvals, status, and visibility</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.vendors.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.vendors.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Currently Live</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sessions.currentlyLive}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-[#D85D28] bg-opacity-10 rounded-lg">
                  <Edit2 className="h-6 w-6 text-[#D85D28]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent.newVendorsLast7Days}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <div></div> {/* Placeholder to maintain grid layout */}
            
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Batch Actions Toolbar */}
        {selectedVendors.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedVendors.size} vendor{selectedVendors.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedVendors(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBatchAction('approve')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => handleBatchAction('reject')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Reject
                </button>


              </div>
            </div>
          </div>
        )}

        {/* Vendors Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center space-x-2 hover:text-gray-700"
                    >
                      {selectedVendors.size === vendors.length && vendors.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Select</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
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
                      Loading vendors...
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className={`hover:bg-gray-50 ${selectedVendors.has(vendor.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectVendor(vendor.id)}
                          className="flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800"
                        >
                          {selectedVendors.has(vendor.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.business_name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {vendor.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.users.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.users.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {vendor.business_type || vendor.subcategory || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(vendor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCurrentlyLive(vendor) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Live
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Offline</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vendor.created_at && new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {vendor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'approved')}
                              className="text-green-600 hover:text-green-900 mr-3"
                              aria-label="Approve vendor"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 mr-3"
                              aria-label="Reject vendor"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setShowModal(true)
                          }}
                          className="text-[#D85D28] hover:text-[#B54A1F] mr-3"
                          aria-label="Edit vendor"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600" aria-label="More options">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-[#D85D28] border-[#D85D28] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vendor Edit Modal */}
        {showModal && selectedVendor && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Vendor: {selectedVendor.business_name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                      value={String(selectedVendor.status) || ''}
                      onChange={(e) => setSelectedVendor({
                        ...selectedVendor,
                        status: e.target.value as 'approved' | 'pending' | 'rejected'
                      })}
                      aria-label="Vendor status"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="rejected">Rejected</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28]"
                      rows={3}
                      value={selectedVendor.admin_notes || ''}
                      onChange={(e) => setSelectedVendor({
                        ...selectedVendor,
                        admin_notes: e.target.value
                      })}
                      placeholder="Add notes about this vendor..."
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
                    onClick={() => updateVendor(selectedVendor.id, {
                      status: selectedVendor.status,
                      admin_notes: selectedVendor.admin_notes
                    })}
                    className="px-4 py-2 bg-[#D85D28] text-white rounded-md hover:bg-[#B54A1F]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Action Confirmation Modal */}
        {showBatchConfirm && batchAction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirm Batch Action
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to <strong>{getBatchActionText()}</strong> the following {selectedVendors.size} vendor{selectedVendors.size !== 1 ? 's' : ''}?
                  </p>
                  
                  <div className="mt-3 max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                    {vendors
                      .filter(v => selectedVendors.has(v.id))
                      .map(vendor => (
                        <div key={vendor.id} className="text-xs text-gray-700 py-1">
                          • {vendor.business_name}
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowBatchConfirm(false)
                      setBatchAction(null)
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={batchLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeBatchAction}
                    disabled={batchLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {batchLoading ? 'Processing...' : `${getBatchActionText().charAt(0).toUpperCase() + getBatchActionText().slice(1)} Vendors`}
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