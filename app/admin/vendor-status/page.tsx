'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Search, Power, PowerOff, Play, Square, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, MessageSquare, Settings } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { AdminVendorView } from '@/types/vendor'

type Vendor = AdminVendorView

interface VendorStatusStats {
  total: number
  live: number
  approved: number
  rejected: number
  pending: number
}

export default function VendorStatusControlPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStatusStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'live', 'offline', 'approved', 'pending'
  const [updatingVendors, setUpdatingVendors] = useState<Set<string>>(new Set())
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [platformSettings, setPlatformSettings] = useState<{
    require_vendor_approval: boolean
    allow_auto_vendor_approval: boolean
  } | null>(null)

  useEffect(() => {
    fetchVendors()
    fetchStats()
    fetchPlatformSettings()
  }, [searchTerm, statusFilter])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/vendor-status?${params}`)
      if (!response.ok) throw new Error('Failed to fetch vendors')
      
      const data = await response.json()
      setVendors(data.vendors)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      showToast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/vendor-status/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchPlatformSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) throw new Error('Failed to fetch platform settings')
      
      const data = await response.json()
      if (data.success && data.settings) {
        setPlatformSettings({
          require_vendor_approval: data.settings.require_vendor_approval || false,
          allow_auto_vendor_approval: data.settings.allow_auto_vendor_approval || false
        })
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error)
    }
  }

  const updateVendorStatus = async (vendorId: string, action: string, value?: any, rejectionReason?: string) => {
    if (updatingVendors.has(vendorId)) return
    
    try {
      setUpdatingVendors(prev => new Set(prev).add(vendorId))
      
      const response = await fetch('/api/admin/vendor-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vendorId, action, value, rejectionReason })
      })

      if (!response.ok) throw new Error('Failed to update vendor status')
      
      const result = await response.json()
      showToast.success(result.message || 'Vendor status updated successfully')
      
      // Refresh data
      await Promise.all([fetchVendors(), fetchStats()])
    } catch (error) {
      console.error('Error updating vendor status:', error)
      showToast.error('Failed to update vendor status')
    } finally {
      setUpdatingVendors(prev => {
        const newSet = new Set(prev)
        newSet.delete(vendorId)
        return newSet
      })
    }
  }

  const handleRejectVendor = () => {
    if (!selectedVendor || !rejectionReason.trim()) {
      showToast.error('Please provide a rejection reason')
      return
    }
    
    updateVendorStatus(selectedVendor.id, 'approve', false, rejectionReason)
    setShowRejectModal(false)
    setSelectedVendor(null)
    setRejectionReason('')
  }

  const openRejectModal = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setShowRejectModal(true)
  }

  const getVendorLiveStatus = (vendor: Vendor) => {
    const activeSessions = vendor.vendor_live_sessions.filter(session => session.is_active)
    return activeSessions.length > 0 ? 'live' : 'offline'
  }

  const getStatusBadge = (vendor: Vendor) => {
    const isLive = getVendorLiveStatus(vendor) === 'live'
    
    if (vendor.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </span>
      )
    }
    
    if (vendor.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <PowerOff className="w-3 h-3 mr-1" />
          Rejected
        </span>
      )
    }
    
    if (vendor.status !== 'approved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <PowerOff className="w-3 h-3 mr-1" />
          Inactive
        </span>
      )
    }
    
    if (isLive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Play className="w-3 h-3 mr-1" />
          Live
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    )
  }

  const filteredVendors = vendors.filter(vendor => {
    if (statusFilter === 'live') {
      return getVendorLiveStatus(vendor) === 'live'
    }
    if (statusFilter === 'offline') {
      return getVendorLiveStatus(vendor) === 'offline' && vendor.status === 'approved'
    }
    if (statusFilter === 'approved') {
      return vendor.status === 'approved'
    }
    if (statusFilter === 'pending') {
      return vendor.status === 'pending'
    }
    if (statusFilter === 'rejected') {
      return vendor.status === 'rejected'
    }
    return true
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Status Control</h1>
            <p className="text-gray-600">Control vendor live sessions, approval status, and activity</p>
          </div>
          <div className="flex items-center space-x-3">
            {platformSettings && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Settings className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {platformSettings.require_vendor_approval ? 'Manual Approval' : 'Auto-Approval'}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                fetchVendors()
                fetchStats()
                fetchPlatformSettings()
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Power className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Play className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Currently Live</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.live}</p>
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
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="all">All Vendors</option>
              <option value="live">Currently Live</option>
              <option value="offline">Offline (Approved)</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>
            
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

        {/* Vendors Control Panel */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Controls
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading vendors...
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const isUpdating = updatingVendors.has(vendor.id)
                    const isLive = getVendorLiveStatus(vendor) === 'live'
                    const activeSessions = vendor.vendor_live_sessions.filter(session => session.is_active)
                    
                    return (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.business_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vendor.users.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(vendor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {activeSessions.length > 0 ? (
                              <div>
                                <span className="font-medium text-red-600">{activeSessions.length} active</span>
                                <div className="text-xs text-gray-500">
                                  Started: {new Date(activeSessions[0].start_time).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No active sessions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* Stop Live Session */}
                            {isLive && (
                              <button
                                onClick={() => updateVendorStatus(vendor.id, 'stop_live_session')}
                                disabled={isUpdating}
                                className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                title="Stop live session"
                              >
                                <Square className="w-3 h-3 mr-1" />
                                Stop Live
                              </button>
                            )}
                            
                            {/* Force Start Session (for testing) */}
                            {!isLive && vendor.status === 'approved' && (
                              <button
                                onClick={() => {
                                  const location = { latitude: 40.7128, longitude: -74.0060, address: 'Test Location' }
                                  updateVendorStatus(vendor.id, 'force_start_session', location)
                                }}
                                disabled={isUpdating}
                                className="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                                title="Start test live session"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Test Live
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {/* Approval Controls */}
                            {vendor.status !== 'approved' ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => updateVendorStatus(vendor.id, 'approve', true)}
                                  disabled={isUpdating}
                                  className="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                                  title="Approve vendor"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => openRejectModal(vendor)}
                                  disabled={isUpdating}
                                  className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                  title="Reject vendor with reason"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => openRejectModal(vendor)}
                                  disabled={isUpdating}
                                  className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                  title="Reject vendor with reason"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </button>
                                {vendor.rejection_reason && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs text-gray-600" title={`Rejection reason: ${vendor.rejection_reason}`} aria-label={`Rejection reason: ${vendor.rejection_reason}`}>
                                    <MessageSquare className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Loading indicator */}
                            {isUpdating && (
                              <div className="inline-flex items-center px-2 py-1">
                                <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reject Vendor Application
                  </h3>
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelectedVendor(null)
                      setRejectionReason('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {selectedVendor && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      You are about to reject the vendor application for:
                    </p>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedVendor.business_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedVendor.users.email}
                    </p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#D85D28] focus:border-[#D85D28] resize-none"
                    placeholder="Please provide a clear reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelectedVendor(null)
                      setRejectionReason('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectVendor}
                    disabled={!rejectionReason.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject Vendor
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